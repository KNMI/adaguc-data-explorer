import { reducers } from './reducers';
import { AdagucMapsState } from './types';

jest.mock('@opengeoweb/webmap', () => ({
  getWMLayerById: jest.fn(),
}));

describe('reducers.setGetFeatureInfoActive', () => {
  const mapId = 'map1';

  const buildState = (): AdagucMapsState => ({
    services: {},
    maps: {
      [mapId]: {
        layers: [],
        isAnimating: false,
        isGetFeatureInfoActive: true,
        mapPinLocation: { lat: 1, lon: 2 },
        view: {
          srs: 'EPSG:3857',
          bbox: { left: -1, bottom: -1, right: 1, top: 1 },
        },
      },
    },
  });

  it('toggles isGetFeatureInfoActive without clearing the pin location', () => {
    // Regression guard: GetFeatureInfo and TimeSeries both read
    // mapPinLocation, and switching between their tabs deactivates one of
    // them without the pin itself having moved. This used to clear the pin
    // on every deactivate, erasing whichever panel wasn't currently shown.
    const state = buildState();

    reducers.setGetFeatureInfoActive(state, {
      payload: { mapId, active: false },
    });

    expect(state.maps[mapId].isGetFeatureInfoActive).toBe(false);
    expect(state.maps[mapId].mapPinLocation).toEqual({ lat: 1, lon: 2 });
  });

  it('does nothing when the map is not registered', () => {
    const state: AdagucMapsState = { services: {}, maps: {} };

    expect(() =>
      reducers.setGetFeatureInfoActive(state, {
        payload: { mapId: 'missing', active: true },
      }),
    ).not.toThrow();
    expect(state.maps).toEqual({});
  });
});

describe('reducers.fullFillAddLayer', () => {
  const mapId = 'map1';
  const serviceUrl = 'http://localhost:8080/adagucserver?dataset=test&';

  const buildState = (): AdagucMapsState => ({ services: {}, maps: {} });

  it('adds the layer even when the service lists no layers at all', () => {
    // Regression guard: some services (e.g. the ADAGUC wikgeneric test
    // dataset) don't enumerate their layers via GetCapabilities even
    // though a given layer works fine. This used to require an exact
    // match there before inserting anything, silently dropping the layer
    // from the panel whenever that lookup came up empty.
    const state = buildState();

    reducers.fullFillAddLayer(state, {
      payload: {
        mapId,
        name: 'air_pressure_msl',
        serviceUrl,
        id: 'layer-1',
        dimensions: [],
        enabled: true,
        styleName: 'pressure_cwk',
        opacity: 1,
        hasError: true,
      },
    });

    expect(state.maps[mapId].layers).toEqual([
      {
        name: 'air_pressure_msl',
        enabled: true,
        serviceUrl,
        id: 'layer-1',
        style: 'pressure_cwk',
        dimensions: [],
        opacity: 1,
        hasError: true,
        isReady: false,
      },
    ]);
  });

  it('falls back to the matched layer default style when none was requested', () => {
    const state = buildState();
    state.services['service-1'] = {
      id: 'service-1',
      serviceUrl,
      layers: [
        {
          name: 'air_pressure_msl',
          styles: [{ name: 'pressure_default' }],
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any,
      ],
    };

    reducers.fullFillAddLayer(state, {
      payload: {
        mapId,
        name: 'air_pressure_msl',
        serviceUrl,
        id: 'layer-1',
        dimensions: [],
        enabled: true,
        opacity: 1,
      },
    });

    expect(state.maps[mapId].layers[0].style).toBe('pressure_default');
  });
});

describe('reducers.syncAnimatedLayerDimension', () => {
  const mapId = 'map1';

  const buildState = (): AdagucMapsState => ({
    services: {},
    maps: {
      [mapId]: {
        isAnimating: true,
        isGetFeatureInfoActive: false,
        layers: [
          {
            id: 'layer-1',
            name: 'air_pressure_msl',
            serviceUrl: 'http://localhost:8080/adagucserver',
            style: 'default',
            dimensions: [
              { name: 'time', currentValue: '2025-01-01T00:00:00Z' },
            ],
            enabled: true,
            opacity: 1,
          },
        ],
        view: {
          srs: 'EPSG:3857',
          bbox: { left: -1, bottom: -1, right: 1, top: 1 },
        },
      },
    },
  });

  it('updates the dimension value without turning animation off', () => {
    // Regression guard: the sidebar time slider reads a layer's redux-
    // tracked dimensions, but useAnimationForLayer's own ticking never
    // touched redux, so the slider never followed an animation. This syncs
    // it in - and must not use changeLayerDimension's reducer for that,
    // since that one always flips isAnimating off (correct for a user
    // dragging the slider, but would stop the very animation it's syncing).
    const state = buildState();

    reducers.syncAnimatedLayerDimension(state, {
      payload: {
        mapId,
        layerIndex: 0,
        dimensionName: 'time',
        dimensionValue: '2025-01-01T05:00:00Z',
      },
    });

    expect(state.maps[mapId].layers[0].dimensions).toEqual([
      { name: 'time', currentValue: '2025-01-01T05:00:00Z' },
    ]);
    expect(state.maps[mapId].isAnimating).toBe(true);
  });

  it('does nothing when the layer index does not exist', () => {
    const state = buildState();

    expect(() =>
      reducers.syncAnimatedLayerDimension(state, {
        payload: {
          mapId,
          layerIndex: 5,
          dimensionName: 'time',
          dimensionValue: '2025-01-01T05:00:00Z',
        },
      }),
    ).not.toThrow();
    expect(state.maps[mapId].layers[0].dimensions).toEqual([
      { name: 'time', currentValue: '2025-01-01T00:00:00Z' },
    ]);
  });
});
