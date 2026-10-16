import { getWMLayerById } from '@opengeoweb/webmap';
import { MapLocation } from '@opengeoweb/webmap-react';
import {
  buildTimeDimensionValue,
  getTimeSeriesUrl,
  TimeDimensionLike,
} from './getTimeSeriesUrl';
import { AdagucLayer } from '../store/types';

jest.mock('@opengeoweb/webmap', () => ({
  getWMLayerById: jest.fn(),
  getCorrectWMSDimName: (name: string) => name.toUpperCase(),
}));

jest.mock('ol/source', () => ({
  ImageWMS: jest.fn().mockImplementation(() => ({
    getFeatureInfoUrl: () => 'http://example.com/wms?LAYERS=air_pressure_msl',
  })),
}));

const mockGetWMLayerById = jest.mocked(getWMLayerById);

const layer: AdagucLayer = {
  id: 'layer-1',
  name: 'air_pressure_msl',
  serviceUrl: 'http://example.com/wms?',
  style: 'default',
  dimensions: [],
  enabled: true,
  opacity: 1,
};

const mapPinLocation: MapLocation = {
  lat: 50,
  lon: 5,
  projectionX: 500000,
  projectionY: 6500000,
  resolution: 1000,
  srs: 'EPSG:3857',
};

const makeTimeDimension = (
  values: string[],
): TimeDimensionLike & { name: string; currentValue: string } => ({
  name: 'time',
  currentValue: values[0],
  size: () => values.length,
  getFirstValue: () => values[0],
  getLastValue: () => values[values.length - 1],
  getValueForIndex: (index: number) => values[index],
});

describe('buildTimeDimensionValue', () => {
  it('uses the full first/last range when no maxTimeSteps is given', () => {
    const dim = makeTimeDimension(['a', 'b', 'c']);
    expect(buildTimeDimensionValue(dim)).toBe('a/c');
  });

  it('uses the full range when the dimension already fits within maxTimeSteps', () => {
    const dim = makeTimeDimension(['a', 'b', 'c']);
    expect(buildTimeDimensionValue(dim, 20)).toBe('a/c');
  });

  it('evenly samples at most maxTimeSteps values, always including both endpoints', () => {
    const values = Array.from({ length: 11 }, (_, i) => `t${i}`);
    const dim = makeTimeDimension(values);
    // 11 values, asking for 6 - evenly spaced indices land on 0,2,4,6,8,10.
    expect(buildTimeDimensionValue(dim, 6)).toBe('t0,t2,t4,t6,t8,t10');
  });

  it('returns a single value (the first) when maxTimeSteps is 1', () => {
    const dim = makeTimeDimension(['t0', 't1', 't2']);
    expect(buildTimeDimensionValue(dim, 1)).toBe('t0');
  });

  it('ignores an invalid (zero or negative) maxTimeSteps and falls back to the full range', () => {
    const dim = makeTimeDimension(['a', 'b', 'c', 'd']);
    expect(buildTimeDimensionValue(dim, 0)).toBe('a/d');
    expect(buildTimeDimensionValue(dim, -5)).toBe('a/d');
  });
});

describe('getTimeSeriesUrl', () => {
  beforeEach(() => {
    mockGetWMLayerById.mockReset();
  });

  it('returns undefined when there is no live WMLayer', () => {
    mockGetWMLayerById.mockReturnValue(undefined);
    expect(getTimeSeriesUrl(layer, mapPinLocation)).toBeUndefined();
  });

  it('passes maxStepsByDimension through to the TIME dimension value', () => {
    const timeDimension = makeTimeDimension(['t0', 't1', 't2', 't3', 't4']);
    mockGetWMLayerById.mockReturnValue({
      getmapURL: 'http://example.com/wms?',
      getLayerName: () => 'air_pressure_msl',
      getDimension: (name: string) =>
        name === 'time' ? timeDimension : undefined,
      getDimensions: () => [timeDimension],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    // 5 values, asking for 3 - evenly spaced indices land on 0, 2, 4.
    // URLSearchParams percent-encodes the comma-separated list.
    const url = getTimeSeriesUrl(layer, mapPinLocation, { time: 3 });
    expect(url).toContain('TIME=t0%2Ct2%2Ct4');
  });

  it('requests the full time range when maxStepsByDimension is not given', () => {
    const timeDimension = makeTimeDimension(['t0', 't1', 't2']);
    mockGetWMLayerById.mockReturnValue({
      getmapURL: 'http://example.com/wms?',
      getLayerName: () => 'air_pressure_msl',
      getDimension: (name: string) =>
        name === 'time' ? timeDimension : undefined,
      getDimensions: () => [timeDimension],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    const url = getTimeSeriesUrl(layer, mapPinLocation);
    expect(url).toContain('TIME=t0%2Ft2');
  });

  it('samples a wildcarded series dimension (e.g. member) when it is also given a limit', () => {
    const timeDimension = makeTimeDimension(['t0', 't1', 't2']);
    const memberDimension = {
      name: 'member',
      currentValue: '1',
      size: () => 10,
      getFirstValue: () => '1',
      getLastValue: () => '10',
      getValueForIndex: (index: number) => String(index + 1),
    };
    mockGetWMLayerById.mockReturnValue({
      getmapURL: 'http://example.com/wms?',
      getLayerName: () => 'air_pressure_msl',
      getDimension: (name: string) =>
        name === 'time' ? timeDimension : undefined,
      getDimensions: () => [timeDimension, memberDimension],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    // 10 members, asking for 4 - evenly spaced indices land on 0,3,6,9.
    const url = getTimeSeriesUrl(layer, mapPinLocation, { member: 4 });
    expect(url).toContain('MEMBER=1%2C4%2C7%2C10');
    // time has no limit given for it, so it keeps its full range.
    expect(url).toContain('TIME=t0%2Ft2');
  });

  it('keeps a wildcarded series dimension as "*" when its limit is not below its size', () => {
    const timeDimension = makeTimeDimension(['t0', 't1', 't2']);
    const memberDimension = {
      name: 'member',
      currentValue: '1',
      size: () => 3,
      getFirstValue: () => '1',
      getLastValue: () => '3',
      getValueForIndex: (index: number) => String(index + 1),
    };
    mockGetWMLayerById.mockReturnValue({
      getmapURL: 'http://example.com/wms?',
      getLayerName: () => 'air_pressure_msl',
      getDimension: (name: string) =>
        name === 'time' ? timeDimension : undefined,
      getDimensions: () => [timeDimension, memberDimension],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    const url = getTimeSeriesUrl(layer, mapPinLocation, { member: 10 });
    expect(url).toContain('MEMBER=*');
  });
});
