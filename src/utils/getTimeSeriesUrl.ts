import { ImageWMS } from 'ol/source';
import { getCorrectWMSDimName, getWMLayerById } from '@opengeoweb/webmap';
import { MapLocation } from '@opengeoweb/webmap-react';
import { AdagucLayer } from '../store/types';
import { SERIES_DIMENSION_NAMES } from './seriesDimensions';

/**
 * Builds a GetFeatureInfo request for the full extent of the layer's time
 * dimension (instead of the current time value), returning the server's
 * timeseries data for the given point as JSON. Any ensemble-member/
 * percentile-like dimension (see SERIES_DIMENSION_NAMES) is widened to "*"
 * (every value), so the response includes every one of them in one request.
 */
// eslint-disable-next-line import/prefer-default-export
export const getTimeSeriesUrl = (
  layer: AdagucLayer,
  mapPinLocation: MapLocation,
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
    if (dimension.name === 'time') {
      value = `${dimension.getFirstValue()}/${dimension.getLastValue()}`;
    } else if (SERIES_DIMENSION_NAMES.has(dimension.name)) {
      value = '*';
    } else {
      value = dimension.currentValue;
    }
    dimParams.append(getCorrectWMSDimName(dimension.name), value);
  });

  return `${url}&${dimParams.toString()}`;
};
