import * as React from 'react';
import { act, render } from '@testing-library/react';
import {
  makeView,
  setViewFromExtent,
  useAnimationForLayer,
} from '@opengeoweb/webmap-react';
import { getWMLayerById } from '@opengeoweb/webmap';
import { useAppDispatch, useAppSelector } from '../store/store';
import { AdagucLayer, ViewerState } from '../store/types';
import { ReduxMapViewComponent } from './ReduxMapViewComponent';

jest.mock('@opengeoweb/webmap', () => ({
  getWMLayerById: jest.fn(),
  generateLayerId: jest.fn(() => 'fake-layer-id'),
  LayerType: {
    baseLayer: 'baseLayer',
    overLayer: 'overLayer',
    mapLayer: 'mapLayer',
  },
}));

// A newly created view isn't attached to the map yet, so OpenLayersMapView
// (the real implementation) is what gives it its correct pixel size, by
// calling map.setView() in its own effect when the `view` prop changes.
// This stand-in simulates exactly that one behaviour - everything else
// about the real map is irrelevant to the regression being guarded here.
let mockAttachViewToMap: jest.Mock;
// Records every <OpenLayersLayer> render's props, so tests can inspect the
// zIndex each data layer is actually given (see layer-ordering tests below)
// without needing a real OL map to observe real draw order from.
let mockOpenLayersLayerCalls: Array<{
  id?: string;
  zIndex?: number;
  dimensions?: unknown;
}>;
jest.mock('@opengeoweb/webmap-react', () => {
  /* eslint-disable
     global-require,
     @typescript-eslint/no-var-requires,
     @typescript-eslint/no-unsafe-call,
     @typescript-eslint/no-unsafe-return,
     @typescript-eslint/no-explicit-any */
  const ReactLib = require('react');
  return {
    OpenLayersMapView: ({ view, children }: any) => {
      ReactLib.useEffect(() => {
        mockAttachViewToMap(view);
      }, [view]);
      return children;
    },
    OpenLayersLayer: (props: any) => {
      mockOpenLayersLayerCalls.push(props);
      return null;
    },
    OpenLayersGetFeatureInfo: () => null,
    getLayerExtentForProjection: jest.fn(),
    setViewFromExtent: jest.fn(),
    makeView: jest.fn(),
    useAnimationForLayer: jest.fn(() => ({ dimensions: [] })),
    TimeContext: ReactLib.createContext({}),
  };
  /* eslint-enable
     global-require,
     @typescript-eslint/no-var-requires,
     @typescript-eslint/no-unsafe-call,
     @typescript-eslint/no-unsafe-return,
     @typescript-eslint/no-explicit-any */
});

jest.mock('../store/store', () => ({
  actions: {
    updateMapView: (payload: unknown) => ({
      type: 'wmsservices/updateMapView',
      payload,
    }),
    initializeLayer: (payload: unknown) => ({
      type: 'wmsservices/initializeLayer',
      payload,
    }),
    setMapPinLocation: (payload: unknown) => ({
      type: 'wmsservices/setMapPinLocation',
      payload,
    }),
    syncAnimatedLayerDimension: (payload: unknown) => ({
      type: 'wmsservices/syncAnimatedLayerDimension',
      payload,
    }),
  },
  useAppDispatch: jest.fn(),
  useAppSelector: jest.fn(),
}));

const mockMakeView = jest.mocked(makeView);
const mockSetViewFromExtent = jest.mocked(setViewFromExtent);
const mockUseAnimationForLayer = jest.mocked(useAnimationForLayer);
const mockGetWMLayerById = jest.mocked(getWMLayerById);
const mockUseAppDispatch = jest.mocked(useAppDispatch);
const mockUseAppSelector = jest.mocked(useAppSelector);

const mapId = 'map1';

// A minimal stand-in for an OL View: just enough for ReduxMapViewComponent's
// other effects (the view-change listener) to attach/detach without
// throwing; nothing in this test exercises real OL view behaviour.
const makeFakeView = (): unknown => ({ on: jest.fn(), un: jest.fn() });

describe('ReduxMapViewComponent', () => {
  let mockState: ViewerState;
  let callOrder: string[];

  beforeEach(() => {
    callOrder = [];
    mockOpenLayersLayerCalls = [];
    mockUseAppDispatch.mockReturnValue(jest.fn());
    mockGetWMLayerById.mockReturnValue(undefined);
    mockUseAnimationForLayer.mockReturnValue({
      dimensions: [],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
    mockMakeView.mockImplementation(() => {
      const view = makeFakeView();
      callOrder.push('makeView');
      return view as ReturnType<typeof makeView>;
    });
    mockAttachViewToMap = jest.fn((view: unknown) => {
      callOrder.push('attachViewToMap');
      return view;
    });
    mockSetViewFromExtent.mockImplementation(() => {
      callOrder.push('setViewFromExtent');
    });

    mockState = {
      viewer: {
        services: {},
        maps: {
          [mapId]: {
            isAnimating: false,
            isGetFeatureInfoActive: false,
            layers: [],
            view: {
              srs: 'EPSG:3857',
              bbox: { left: -1, bottom: -1, right: 1, top: 1 },
            },
          },
        },
      },
    };
    mockUseAppSelector.mockImplementation((selector) => selector(mockState));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('attaches a new view to the map before fitting it to a viewCommand bbox', () => {
    const { rerender } = render(
      <ReduxMapViewComponent mapId={mapId} update={jest.fn()} />,
    );
    // The initial mount already creates and attaches a default view; only
    // the calls triggered by the viewCommand below are under test.
    callOrder.length = 0;

    const bbox = { left: 10, bottom: 20, right: 30, top: 40 };
    act(() => {
      mockState = {
        ...mockState,
        viewer: {
          ...mockState.viewer,
          maps: {
            ...mockState.viewer.maps,
            [mapId]: {
              ...mockState.viewer.maps[mapId],
              viewCommand: { srs: 'EPSG:28992', bbox, requestId: 1 },
            },
          },
        },
      };
      rerender(<ReduxMapViewComponent mapId={mapId} update={jest.fn()} />);
    });

    expect(callOrder).toEqual([
      'makeView',
      'attachViewToMap',
      'setViewFromExtent',
    ]);

    // Fitting must happen on the exact view that was created for this
    // viewCommand and attached to the map - not on some other view (e.g.
    // the initial default one from mount, attached once before this).
    const lastAttachCall =
      mockAttachViewToMap.mock.calls[mockAttachViewToMap.mock.calls.length - 1];
    const attachedView = lastAttachCall[0];
    const [fittedView, fittedBbox] = mockSetViewFromExtent.mock.calls[0];
    expect(fittedView).toBe(attachedView);
    expect(fittedBbox).toEqual(bbox);
  });

  it('does not re-fit when the component re-renders without a new viewCommand', () => {
    const { rerender } = render(
      <ReduxMapViewComponent mapId={mapId} update={jest.fn()} />,
    );

    act(() => {
      rerender(<ReduxMapViewComponent mapId={mapId} update={jest.fn()} />);
    });

    expect(mockSetViewFromExtent).not.toHaveBeenCalled();
  });

  it('draws the layer at the top of the list above the ones below it', () => {
    const topLayer: AdagucLayer = {
      id: 'layer-top',
      name: 'Top layer',
      serviceUrl: 'http://example.com/wms',
      style: 'default',
      dimensions: [],
      enabled: true,
      opacity: 1,
    };
    const bottomLayer: AdagucLayer = {
      id: 'layer-bottom',
      name: 'Bottom layer',
      serviceUrl: 'http://example.com/wms',
      style: 'default',
      dimensions: [],
      enabled: true,
      opacity: 1,
    };
    // Index 0 is the top of the sidebar layer list (see SortableLayerList),
    // so it must end up with the highest zIndex on the map.
    mockState.viewer.maps[mapId].layers = [topLayer, bottomLayer];

    render(<ReduxMapViewComponent mapId={mapId} update={jest.fn()} />);

    const zIndexById = new Map(
      mockOpenLayersLayerCalls.map((call) => [call.id, call.zIndex]),
    );

    expect(zIndexById.get('layer-top')).toBeGreaterThan(
      zIndexById.get('layer-bottom'),
    );
  });

  it('re-draws layers in the new order after they are reordered in the list', () => {
    const layerA: AdagucLayer = {
      id: 'layer-a',
      name: 'Layer A',
      serviceUrl: 'http://example.com/wms',
      style: 'default',
      dimensions: [],
      enabled: true,
      opacity: 1,
    };
    const layerB: AdagucLayer = {
      id: 'layer-b',
      name: 'Layer B',
      serviceUrl: 'http://example.com/wms',
      style: 'default',
      dimensions: [],
      enabled: true,
      opacity: 1,
    };
    mockState.viewer.maps[mapId].layers = [layerA, layerB];
    const { rerender } = render(
      <ReduxMapViewComponent mapId={mapId} update={jest.fn()} />,
    );

    const initialZIndexById = new Map(
      mockOpenLayersLayerCalls.map((call) => [call.id, call.zIndex]),
    );
    expect(initialZIndexById.get('layer-a')).toBeGreaterThan(
      initialZIndexById.get('layer-b'),
    );

    // Drag layer-b to the top of the list.
    mockOpenLayersLayerCalls = [];
    mockState = {
      ...mockState,
      viewer: {
        ...mockState.viewer,
        maps: {
          ...mockState.viewer.maps,
          [mapId]: {
            ...mockState.viewer.maps[mapId],
            layers: [layerB, layerA],
          },
        },
      },
    };
    act(() => {
      rerender(<ReduxMapViewComponent mapId={mapId} update={jest.fn()} />);
    });

    const reorderedZIndexById = new Map(
      mockOpenLayersLayerCalls.map((call) => [call.id, call.zIndex]),
    );
    expect(reorderedZIndexById.get('layer-b')).toBeGreaterThan(
      reorderedZIndexById.get('layer-a'),
    );
  });

  it('drives every animated layer from the same shared animation tick', () => {
    // Regression guard: each animated layer used to call
    // useAnimationForLayer itself, each with its own independent timer -
    // since those timers aren't synchronised with each other, layers
    // visibly updated at slightly different moments. Mounting a single
    // AnimationClock and broadcasting its tick to every layer keeps them
    // moving in lockstep, since they all then re-render from the same tick.
    const layerA: AdagucLayer = {
      id: 'layer-a',
      name: 'Layer A',
      serviceUrl: 'http://example.com/wms',
      style: 'default',
      dimensions: [],
      enabled: true,
      opacity: 1,
    };
    const layerB: AdagucLayer = {
      id: 'layer-b',
      name: 'Layer B',
      serviceUrl: 'http://example.com/wms',
      style: 'default',
      dimensions: [],
      enabled: true,
      opacity: 1,
    };
    mockState.viewer.maps[mapId].layers = [layerA, layerB];
    mockState.viewer.maps[mapId].isAnimating = true;

    const fakeTimeDimension = {
      getClosestValue: jest.fn((value: string) => value),
    };
    mockGetWMLayerById.mockReturnValue({
      getDimension: (name: string) =>
        name === 'time' ? fakeTimeDimension : undefined,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
    mockUseAnimationForLayer.mockReturnValue({
      dimensions: [{ name: 'time', currentValue: '2025-01-01T00:00:00Z' }],
      timeContext: { isAnimating: true, prefetchList: [] },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    act(() => {
      render(<ReduxMapViewComponent mapId={mapId} update={jest.fn()} />);
    });

    // A single shared clock drives the ticking - it is only ever given
    // layer-a (the first layer with a time dimension), never layer-b, even
    // though layer-b also animates.
    const clockedLayerIds = new Set(
      mockUseAnimationForLayer.mock.calls.map(
        (call) => (call[0] as { id?: string }).id,
      ),
    );
    expect(clockedLayerIds).toEqual(new Set(['layer-a']));

    const dimensionsById = new Map(
      mockOpenLayersLayerCalls.map((call) => [call.id, call.dimensions]),
    );
    expect(dimensionsById.get('layer-a')).toEqual([
      { name: 'time', currentValue: '2025-01-01T00:00:00Z' },
    ]);
    expect(dimensionsById.get('layer-b')).toEqual([
      { name: 'time', currentValue: '2025-01-01T00:00:00Z' },
    ]);
  });
});
