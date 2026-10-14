import * as React from 'react';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { getWMLayerById } from '@opengeoweb/webmap';
import { useAppDispatch, useAppSelector } from '../../store/store';
import { AdagucLayer, ViewerState } from '../../store/types';
import { getFeatureInfoUrl } from '../../utils/getFeatureInfoUrl';
import { getTimeSeriesUrl } from '../../utils/getTimeSeriesUrl';
import { getHistogramUrl } from '../../utils/getHistogramUrl';
import QueryPanel from './QueryPanel';

jest.mock('@opengeoweb/webmap', () => ({
  getWMLayerById: jest.fn(),
}));

// getFeatureInfoUrl/getTimeSeriesUrl both pull in 'ol/source' (an ESM-only
// package jest can't parse as-is) just to build a GetFeatureInfo url - that
// machinery isn't what this test is about, so the builders are stubbed
// directly rather than mocking 'ol/source' itself.
jest.mock('../../utils/getFeatureInfoUrl', () => ({
  getFeatureInfoUrl: jest.fn(),
}));
jest.mock('../../utils/getTimeSeriesUrl', () => ({
  getTimeSeriesUrl: jest.fn(),
}));
jest.mock('../../utils/getHistogramUrl', () => ({
  getHistogramUrl: jest.fn(),
}));

jest.mock('../../store/store', () => ({
  actions: {
    changeLayerDimension: (payload: unknown) => ({
      type: 'wmsservices/changeLayerDimension',
      payload,
    }),
    setHistogramBoxSelectActive: (payload: unknown) => ({
      type: 'wmsservices/setHistogramBoxSelectActive',
      payload,
    }),
  },
  useAppDispatch: jest.fn(),
  useAppSelector: jest.fn(),
}));

// recharts renders real SVG geometry based on measured DOM layout, which
// jsdom doesn't provide, so hit-testing a click to the right data point
// can't be exercised this way. Standing in for LineChart/BarChart with
// plain divs lets these tests focus on what is actually ours to verify.
let mockClickedChartLabel: string | undefined;
jest.mock('recharts', () => {
  /* eslint-disable
     global-require,
     @typescript-eslint/no-var-requires,
     @typescript-eslint/no-unsafe-call,
     @typescript-eslint/no-unsafe-return,
     @typescript-eslint/no-explicit-any */
  const ReactLib = require('react');
  return {
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) =>
      children,
    LineChart: ({ children, onClick }: any) =>
      ReactLib.createElement(
        'div',
        {
          'data-testid': 'timeseries-chart',
          onClick: () => onClick?.({ activeLabel: mockClickedChartLabel }),
        },
        children,
      ),
    BarChart: ({ children, data }: any) =>
      ReactLib.createElement(
        'div',
        { 'data-testid': 'histogram-chart', 'data-bin-count': data.length },
        children,
      ),
    Bar: () => null,
    Line: () => null,
    XAxis: () => null,
    YAxis: () => null,
    CartesianGrid: () => null,
    Tooltip: () => null,
    Legend: () => null,
  };
  /* eslint-enable
     global-require,
     @typescript-eslint/no-var-requires,
     @typescript-eslint/no-unsafe-call,
     @typescript-eslint/no-unsafe-return,
     @typescript-eslint/no-explicit-any */
});

const mockGetWMLayerById = jest.mocked(getWMLayerById);
const mockGetFeatureInfoUrl = jest.mocked(getFeatureInfoUrl);
const mockGetTimeSeriesUrl = jest.mocked(getTimeSeriesUrl);
const mockGetHistogramUrl = jest.mocked(getHistogramUrl);
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

const fakeHistogramBox = {
  bbox: { left: -1, bottom: -1, right: 1, top: 1 },
  srs: 'EPSG:3857',
  pixelWidth: 190,
  pixelHeight: 959,
};

const fakeTimeSeriesResponse = [
  {
    standard_name: 'air_pressure_at_mean_sea_level',
    units: 'hPa',
    data: {
      '2025-01-01T00:00:00Z': '1000.000000',
      '2025-01-01T01:00:00Z': '1001.000000',
    },
  },
];

const fakeHistogramResponse = {
  air_pressure_msl: {
    numdatasources: 1,
    numdataobjects: 1,
    units: 'hPa',
    layername: 'air_pressure_msl',
    min: 989.1,
    max: 1024.3,
    average: 1005.2,
    stddev: 7.8,
    fieldmin: 989.1,
    fieldmax: 1024.3,
    interval: [989.1, 994.5],
    quantity: [120, 3400],
    width: [5.4, 5.4],
  },
};

describe('QueryPanel', () => {
  let mockDispatch: jest.Mock;
  let fakeState: ViewerState;

  const buildState = (
    overrides: Partial<ViewerState['viewer']['maps']['map1']> = {},
  ): ViewerState => ({
    viewer: {
      services: {},
      baseLayers: [],
      maps: {
        [mapId]: {
          isAnimating: false,
          isGetFeatureInfoActive: false,
          isHistogramBoxSelectActive: false,
          layers: [fakeLayer],
          view: {
            srs: 'EPSG:3857',
            bbox: { left: -1, bottom: -1, right: 1, top: 1 },
          },
          ...overrides,
        },
      },
    },
  });

  beforeEach(() => {
    mockDispatch = jest.fn();
    mockUseAppDispatch.mockReturnValue(mockDispatch);

    fakeState = buildState();
    mockUseAppSelector.mockImplementation((selector) => selector(fakeState));

    mockGetFeatureInfoUrl.mockReturnValue(
      'http://localhost:8080/adagucserver?mock=getfeatureinfo',
    );
    mockGetTimeSeriesUrl.mockReturnValue(
      'http://localhost:8080/adagucserver?mock=timeseries',
    );
    mockGetHistogramUrl.mockReturnValue(
      'http://localhost:8080/adagucserver?mock=histogram',
    );

    mockClickedChartLabel = '2025-01-01T01:00:00Z';
  });

  afterEach(() => {
    jest.clearAllMocks();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (global as any).fetch;
  });

  it('fetches and renders GetFeatureInfo results for the clicked point by default', async () => {
    // GetFeatureInfo and TimeSeries both react to the same map-click pin,
    // so both fetch effects run here regardless of which subtab is shown -
    // the response needs both shapes to avoid an unrelated console.error.
    global.fetch = jest.fn().mockResolvedValue({
      text: () => Promise.resolve('<b>result</b>'),
      json: () => Promise.resolve(fakeTimeSeriesResponse),
    }) as unknown as typeof fetch;
    fakeState = buildState({ mapPinLocation: fakeMapPinLocation });

    render(<QueryPanel mapId={mapId} isActive />);

    expect(
      screen.getByRole('button', { name: 'GetFeatureInfo' }).className,
    ).toContain('MuiButton-contained');
    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8080/adagucserver?mock=getfeatureinfo',
      ),
    );
    expect(await screen.findByText('result')).toBeInTheDocument();
  });

  it('snaps a clicked time series point to the dimension and jumps the layer to it', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      json: () => Promise.resolve(fakeTimeSeriesResponse),
      text: () => Promise.resolve('<b>result</b>'),
    }) as unknown as typeof fetch;
    fakeState = buildState({ mapPinLocation: fakeMapPinLocation });

    const mockGetClosestValue = jest.fn().mockReturnValue(
      // A different value than what was clicked, to prove the snapped
      // value (not the raw click) is what ends up dispatched.
      '2025-01-01T01:30:00Z',
    );
    mockGetWMLayerById.mockReturnValue({
      getDimension: (name: string) =>
        name === 'time' ? { getClosestValue: mockGetClosestValue } : undefined,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    render(<QueryPanel mapId={mapId} isActive />);
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'TimeSeries' }));
    });

    const chart = await waitFor(() => screen.getByTestId('timeseries-chart'));
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

  it('toggles histogram box-select and renders bins once a box is dragged', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      json: () => Promise.resolve(fakeHistogramResponse),
    }) as unknown as typeof fetch;

    const { rerender } = render(<QueryPanel mapId={mapId} isActive />);
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Histogram' }));
    });

    act(() => {
      fireEvent.click(
        screen.getByRole('button', { name: 'Select area for histogram' }),
      );
    });
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'wmsservices/setHistogramBoxSelectActive',
      payload: { mapId, active: true },
    });

    fakeState = buildState({ histogramBox: fakeHistogramBox });
    rerender(<QueryPanel mapId={mapId} isActive />);

    const chart = await waitFor(() => screen.getByTestId('histogram-chart'));
    expect(chart.getAttribute('data-bin-count')).toBe('2');
  });

  it('turns histogram box-select off when the Histogram subtab is left or the panel becomes inactive', () => {
    const { rerender } = render(<QueryPanel mapId={mapId} isActive />);
    mockDispatch.mockClear();

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Histogram' }));
    });
    // Visiting the subtab itself must not turn box-select on by itself -
    // only the explicit button inside it (covered above) does that.
    expect(mockDispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'wmsservices/setHistogramBoxSelectActive',
      }),
    );

    mockDispatch.mockClear();
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'GetFeatureInfo' }));
    });
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'wmsservices/setHistogramBoxSelectActive',
      payload: { mapId, active: false },
    });

    mockDispatch.mockClear();
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Histogram' }));
    });
    mockDispatch.mockClear();
    rerender(<QueryPanel mapId={mapId} isActive={false} />);
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'wmsservices/setHistogramBoxSelectActive',
      payload: { mapId, active: false },
    });
  });
});
