import { SERIES_DIMENSION_NAMES } from './seriesDimensions';

export interface TimeSeriesPoint {
  time: string;
  value: number;
}

export interface TimeSeriesSeries {
  // The series' value along the series dimension (e.g. a percentile or
  // ensemble member), or '' when the response has no such dimension.
  seriesName: string;
  points: TimeSeriesPoint[];
}

export interface TimeSeriesResult {
  standardName?: string;
  units?: string;
  // Name of the dimension the series are split by (e.g. "percentile"),
  // undefined when the response is a single, unlabelled series.
  seriesDimensionName?: string;
  series: TimeSeriesSeries[];
}

type TimeSeriesDataNode = string | { [key: string]: TimeSeriesDataNode };

interface TimeSeriesResponseEntry {
  standard_name?: string;
  // The server reports units as "{}" rather than omitting the field when
  // they are unknown for a layer, so this isn't always a string.
  units?: string | Record<string, never>;
  // The server sends a bare string (not a one-element array) when there's
  // only a single dimension (e.g. "time", with no series dimension) -
  // only an array when there's more than one.
  dims?: string | string[];
  data?: TimeSeriesDataNode;
}

const toPoints = (leaf: Record<string, string>): TimeSeriesPoint[] =>
  Object.entries(leaf)
    .map(([time, value]) => ({ time, value: parseFloat(value) }))
    .filter((point) => Number.isFinite(point.value))
    .sort((a, b) => a.time.localeCompare(b.time));

export const compareSeriesNames = (a: string, b: string): number => {
  const numericA = Number(a);
  const numericB = Number(b);
  if (Number.isFinite(numericA) && Number.isFinite(numericB)) {
    return numericA - numericB;
  }
  return a.localeCompare(b);
};

// The adaguc GetFeatureInfo JSON response nests "data" once per extra
// dimension (e.g. reference_time), with the innermost level mapping
// time -> value. Walk down to that innermost level, taking the last
// (only) key at each level along the way. Used when there is no series
// dimension to split into multiple series instead.
const findLeafTimeValueMap = (
  node: TimeSeriesDataNode | undefined,
): Record<string, string> | undefined => {
  if (!node || typeof node !== 'object') {
    return undefined;
  }
  const keys = Object.keys(node);
  if (keys.length === 0) {
    return undefined;
  }
  const firstValue = node[keys[0]];
  if (typeof firstValue === 'string') {
    return node as Record<string, string>;
  }
  return findLeafTimeValueMap(node[keys[keys.length - 1]]);
};

// Walks down to the series dimension's nesting level (per `dims`, unwrapping
// any singular dimensions above it, each of which only ever has one key
// since getTimeSeriesUrl keeps them fixed at their current value), then
// returns its node directly so each of its keys can become its own series.
const findSeriesLevelNode = (
  node: TimeSeriesDataNode | undefined,
  seriesDimensionIndex: number,
): { [key: string]: TimeSeriesDataNode } | undefined => {
  let current = node;
  for (let i = 0; i < seriesDimensionIndex; i += 1) {
    if (!current || typeof current !== 'object') {
      return undefined;
    }
    const keys = Object.keys(current);
    if (keys.length === 0) {
      return undefined;
    }
    current = current[keys[0]];
  }
  if (!current || typeof current === 'string') {
    return undefined;
  }
  return current;
};

export const parseTimeSeriesResponse = (
  json: unknown,
): TimeSeriesResult | undefined => {
  if (!Array.isArray(json) || json.length === 0) {
    return undefined;
  }
  const entry = json[0] as TimeSeriesResponseEntry;
  const units = typeof entry.units === 'string' ? entry.units : undefined;
  const dims =
    typeof entry.dims === 'string' ? [entry.dims] : (entry.dims ?? []);

  const seriesDimensionIndex = dims.findIndex((name) =>
    SERIES_DIMENSION_NAMES.has(name),
  );

  if (seriesDimensionIndex !== -1) {
    const seriesLevelNode = findSeriesLevelNode(
      entry.data,
      seriesDimensionIndex,
    );
    const series = Object.entries(seriesLevelNode ?? {})
      .map(([seriesName, value]) => {
        if (typeof value === 'string' || !value) {
          return undefined;
        }
        const points = toPoints(value as Record<string, string>);
        return points.length > 0 ? { seriesName, points } : undefined;
      })
      .filter((s): s is TimeSeriesSeries => !!s)
      .sort((a, b) => compareSeriesNames(a.seriesName, b.seriesName));

    if (series.length > 0) {
      return {
        standardName: entry.standard_name,
        units,
        seriesDimensionName: dims[seriesDimensionIndex],
        series,
      };
    }
  }

  const timeValueMap = findLeafTimeValueMap(entry.data);
  if (!timeValueMap) {
    return undefined;
  }

  return {
    standardName: entry.standard_name,
    units,
    series: [{ seriesName: '', points: toPoints(timeValueMap) }],
  };
};
