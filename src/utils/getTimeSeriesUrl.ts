import { ImageWMS } from 'ol/source';
import { getCorrectWMSDimName, getWMLayerById } from '@opengeoweb/webmap';
import { MapLocation } from '@opengeoweb/webmap-react';
import { AdagucLayer } from '../store/types';
import { SERIES_DIMENSION_NAMES } from './seriesDimensions';

// Just the parts of a WMJSDimension that buildTimeDimensionValue actually
// needs, so it stays easy to mock in tests.
export interface TimeDimensionLike {
  size(): number;
  getFirstValue(): string;
  getLastValue(): string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getValueForIndex(index: number): any;
}

// Evenly samples at most maxSteps values across a dimension's full range
// of indices (0..size()-1), always including both endpoints.
const sampleDimensionValues = (
  dimension: TimeDimensionLike,
  maxSteps: number,
): string[] => {
  const totalSteps = dimension.size();
  const sampledIndices = new Set<number>();
  for (let i = 0; i < maxSteps; i += 1) {
    const index =
      maxSteps === 1 ? 0 : Math.round((i * (totalSteps - 1)) / (maxSteps - 1));
    sampledIndices.add(index);
  }
  return Array.from(sampledIndices)
    .sort((a, b) => a - b)
    .map((index) => String(dimension.getValueForIndex(index)));
};

// The full first/last range can ask the server for more time steps than
// it's willing to serve in one request (adaguc-server rejects a request
// whose total cell count - time steps times any wildcarded series
// dimension - exceeds its own maxquerylimit). When maxTimeSteps is given
// and the range would exceed it, evenly samples at most that many points
// across the range instead - always including both endpoints - sent as an
// explicit comma-separated list rather than a continuous range.
export const buildTimeDimensionValue = (
  timeDimension: TimeDimensionLike,
  maxTimeSteps?: number,
): string => {
  const totalSteps = timeDimension.size();
  if (!maxTimeSteps || maxTimeSteps < 1 || totalSteps <= maxTimeSteps) {
    return `${timeDimension.getFirstValue()}/${timeDimension.getLastValue()}`;
  }
  return sampleDimensionValues(timeDimension, maxTimeSteps).join(',');
};

/**
 * Builds a GetFeatureInfo request for the full extent of the layer's time
 * dimension (instead of the current time value), returning the server's
 * timeseries data for the given point as JSON. Any ensemble-member/
 * percentile-like dimension (see SERIES_DIMENSION_NAMES) is widened to "*"
 * (every value), so the response includes every one of them in one request.
 *
 * `maxStepsByDimension`, when given, caps how many values are actually
 * requested for the named dimension(s) (evenly sampled across that
 * dimension's full range/value set) instead of the usual full time range
 * or "*" wildcard - used to retry a request that failed because it asked
 * for more data than the server's own query limit allows, by shrinking
 * whichever dimensions (time, member, percentile, ...) are needed to fit
 * (see QueryPanel's maxquerylimit handling).
 */
export const getTimeSeriesUrl = (
  layer: AdagucLayer,
  mapPinLocation: MapLocation,
  maxStepsByDimension?: Record<string, number>,
): string | undefined => {
  const wmLayer = getWMLayerById(layer.id);
  if (!wmLayer || !mapPinLocation || !wmLayer.getmapURL) {
    return undefined;
  }

  const timeDimension = wmLayer.getDimension('time');
  if (!timeDimension) {
    return undefined;
  }

  const source = new ImageWMS({
    url: wmLayer.getmapURL,
    params: { LAYERS: wmLayer.getLayerName() },
  });

  const url = source.getFeatureInfoUrl(
    [mapPinLocation.projectionX, mapPinLocation.projectionY],
    mapPinLocation.resolution,
    mapPinLocation.srs,
    { INFO_FORMAT: 'application/json' },
  );

  if (!url) {
    return undefined;
  }

  const dimParams = new URLSearchParams();
  wmLayer.getDimensions().forEach((dimension) => {
    let value: string;
    const maxSteps = maxStepsByDimension?.[dimension.name];
    if (dimension.name === 'time') {
      value = buildTimeDimensionValue(dimension, maxSteps);
    } else if (SERIES_DIMENSION_NAMES.has(dimension.name)) {
      // Normally every series value is requested ("*"), but when a
      // retry needs to shrink this dimension too (not just time) to fit
      // under the server's query limit, sample it down instead.
      value =
        maxSteps && maxSteps > 0 && dimension.size() > maxSteps
          ? sampleDimensionValues(dimension, maxSteps).join(',')
          : '*';
    } else {
      value = dimension.currentValue;
    }
    dimParams.append(getCorrectWMSDimName(dimension.name), value);
  });

  return `${url}&${dimParams.toString()}`;
};
