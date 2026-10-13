import * as React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { getWMLayerById } from '@opengeoweb/webmap';
import { useAppDispatch, useAppSelector } from '../../store/store';
import { AdagucLayer, ViewerState } from '../../store/types';
import { getTimeSeriesUrl } from '../../utils/getTimeSeriesUrl';
import TimeSeriesPanel from './TimeSeriesPanel';

jest.mock('@opengeoweb/webmap', () => ({
  getWMLayerById: jest.fn(),
}));

jest.mock('../../utils/getTimeSeriesUrl', () => ({
  getTimeSeriesUrl: jest.fn(),
}));

jest.mock('../../store/store', () => ({
  actions: {
    changeLayerDimension: (payload: unknown) => ({
      type: 'wmsservices/changeLayerDimension',
      payload,
    }),
  },
  useAppDispatch: jest.fn(),
  useAppSelector: jest.fn(),
}));

// recharts renders real SVG geometry based on measured DOM layout, which
// jsdom doesn't provide, so hit-testing a click to the right data point
// can't be exercised this way. Replacing LineChart with a stand-in that
// calls onClick with a fixed activeLabel lets this test focus on what is
// actually ours to verify: that TimeSeriesPanel reacts correctly to the
// activeLabel recharts reports, not recharts' own hit-testing.
let mockClickedChartLabel: string | undefined;
jest.mock('recharts', () => {
  /* eslint-disable
     global-require,
     @typescript-eslint/no-var-requires,
     @typescript-eslint/no-unsafe-call,
     @typescript-eslint/no-unsafe-return */
  const ReactLib = require('react');
  return {
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) =>
      children,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    LineChart: ({ children, onClick }: any) =>
      ReactLib.createElement(
        'div',
        {
          'data-testid': 'chart',
          onClick: () => onClick?.({ activeLabel: mockClickedChartLabel }),
        },
        children,
      ),
    Line: () => null,
    XAxis: () => null,
    YAxis: () => null,
    CartesianGrid: () => null,
    Tooltip: () => null,
  };
  /* eslint-enable
     global-require,
     @typescript-eslint/no-var-requires,
     @typescript-eslint/no-unsafe-call,
     @typescript-eslint/no-unsafe-return */
});

const mockGetWMLayerById = jest.mocked(getWMLayerById);
const mockGetTimeSeriesUrl = jest.mocked(getTimeSeriesUrl);
const mockUseAppDispatch = jest.mocked(useAppDispatch);
const mockUseAppSelector = jest.mocked(useAppSelector);

const mapId = 'map1';
const layerId = 'layer-1';

const fakeLayer: AdagucLayer = {
  id: layerId,
  name: 'air_pressure_msl',
  serviceUrl: 'http://localhost:8080/adagucserver',
  style: 'default',
  dimensions: [{ name: 'time', currentValue: '2025-01-01T00:00:00Z' }],
  enabled: true,
  opacity: 1,
};

const fakeMapPinLocation = {
  lat: 50,
  lon: 5,
  projectionX: 500000,
  projectionY: 6500000,
  resolution: 1000,
  srs: 'EPSG:3857',
};

const fakeApiResponse = [
  {
    standard_name: 'air_pressure_at_mean_sea_level',
    units: 'hPa',
    data: {
      '2025-01-01T00:00:00Z': '1000.000000',
      '2025-01-01T01:00:00Z': '1001.000000',
      '2025-01-01T02:00:00Z': '1002.000000',
    },
  },
];

describe('TimeSeriesPanel', () => {
  let mockDispatch: jest.Mock;
  let fakeState: ViewerState;

  beforeEach(() => {
    mockDispatch = jest.fn();
    mockUseAppDispatch.mockReturnValue(mockDispatch);

    fakeState = {
      viewer: {
        services: {},
        maps: {
          [mapId]: {
            isAnimating: false,
            isGetFeatureInfoActive: false,
            layers: [fakeLayer],
            view: {
              srs: 'EPSG:3857',
              bbox: { left: -1, bottom: -1, right: 1, top: 1 },
            },
            mapPinLocation: fakeMapPinLocation,
          },
        },
      },
    };
    mockUseAppSelector.mockImplementation((selector) => selector(fakeState));

    mockGetTimeSeriesUrl.mockReturnValue(
      'http://localhost:8080/adagucserver?mock=getfeatureinfo',
    );

    global.fetch = jest.fn().mockResolvedValue({
      json: () => Promise.resolve(fakeApiResponse),
    }) as unknown as typeof fetch;

    mockClickedChartLabel = '2025-01-01T01:00:00Z';
  });

  afterEach(() => {
    jest.clearAllMocks();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (global as any).fetch;
  });

  it('snaps the clicked time to the dimension and jumps the layer to it', async () => {
    const mockGetClosestValue = jest.fn().mockReturnValue(
      // A different value than what was clicked, to prove the snapped
      // value (not the raw click) is what ends up dispatched.
      '2025-01-01T01:30:00Z',
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockGetWMLayerById.mockReturnValue({
      getDimension: (name: string) =>
        name === 'time' ? { getClosestValue: mockGetClosestValue } : undefined,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    render(<TimeSeriesPanel mapId={mapId} />);

    const chart = await waitFor(() => screen.getByTestId('chart'));
    fireEvent.click(chart);

    expect(mockGetClosestValue).toHaveBeenCalledWith(
      '2025-01-01T01:00:00Z',
      true,
    );
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'wmsservices/changeLayerDimension',
      payload: {
        mapId,
        layerIndex: 0,
        dimensionName: 'time',
        dimensionValue: '2025-01-01T01:30:00Z',
      },
    });
  });

  it('falls back to the raw clicked time when the layer has no live time dimension', async () => {
    mockGetWMLayerById.mockReturnValue(undefined);

    render(<TimeSeriesPanel mapId={mapId} />);

    const chart = await waitFor(() => screen.getByTestId('chart'));
    fireEvent.click(chart);

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'wmsservices/changeLayerDimension',
      payload: {
        mapId,
        layerIndex: 0,
        dimensionName: 'time',
        dimensionValue: '2025-01-01T01:00:00Z',
      },
    });
  });

  // getMapLayers is a reselect selector memoized on the referential
  // identity of state.viewer.maps[mapId] - mutating that object in place
  // (rather than replacing it) would make it keep returning its previous,
  // cached result. Building a fresh map/layers list each time, the same
  // way a real reducer would, is what actually exercises a change.
  const setLayers = (layers: AdagucLayer[]): void => {
    fakeState = {
      ...fakeState,
      viewer: {
        ...fakeState.viewer,
        maps: {
          ...fakeState.viewer.maps,
          [mapId]: { ...fakeState.viewer.maps[mapId], layers },
        },
      },
    };
  };

  it('does not refetch when only the time dimension changes', async () => {
    // Regression guard: getTimeSeriesUrl always requests the layer's full
    // time range (not its current value), so the request itself never
    // changes when just the time dimension does - e.g. while an animation
    // is running. This used to refetch (and erase/reload every chart)
    // on every single tick regardless.
    const { rerender } = render(<TimeSeriesPanel mapId={mapId} />);
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));

    setLayers([
      {
        ...fakeLayer,
        dimensions: [{ name: 'time', currentValue: '2025-01-01T05:00:00Z' }],
      },
    ]);
    rerender(<TimeSeriesPanel mapId={mapId} />);

    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('refetches when a non-time dimension changes', async () => {
    const layerWithElevation: AdagucLayer = {
      ...fakeLayer,
      dimensions: [
        { name: 'time', currentValue: '2025-01-01T00:00:00Z' },
        { name: 'elevation', currentValue: '1000' },
      ],
    };
    setLayers([layerWithElevation]);
    const { rerender } = render(<TimeSeriesPanel mapId={mapId} />);
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));

    setLayers([
      {
        ...layerWithElevation,
        dimensions: [
          { name: 'time', currentValue: '2025-01-01T00:00:00Z' },
          { name: 'elevation', currentValue: '2000' },
        ],
      },
    ]);
    rerender(<TimeSeriesPanel mapId={mapId} />);

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2));
  });
});
