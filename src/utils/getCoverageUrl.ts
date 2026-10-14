import { Bbox } from '@opengeoweb/webmap';
import { makeGoodServiceLink } from './makeGoodServiceLink';

export { makeGoodServiceLink };

export interface GetCoverageDimensionValue {
  name: string;
  currentValue: string;
}

export type GetCoverageGridProperties =
  | { mode: 'cellsize'; xResolution: number; yResolution: number }
  | { mode: 'rastersize'; width: number; height: number };

export interface GetCoverageOptions {
  service: string;
  coverageName: string;
  projection: string;
  format: string;
  bbox: Bbox;
  grid: GetCoverageGridProperties;
  dimensionValues: GetCoverageDimensionValue[];
}

// A dimension keeps its own name in a GetCoverage request for "elevation"
// and "time" - any other (e.g. "reference_time", a percentile/ensemble
// dimension) needs the WCS "DIM_" prefix instead.
const getCoverageDimensionParamName = (dimensionName: string): string => {
  const upperName = dimensionName.toUpperCase();
  if (upperName === 'ELEVATION' || upperName === 'TIME') {
    return upperName;
  }
  return `DIM_${upperName}`;
};

// Builds the request the same way as every other GetMap/GetFeatureInfo url
// elsewhere in this app (getFeatureInfoUrl.ts, getTimeSeriesUrl.ts,
// AutoWMS.tsx): plain "&name=value" concatenation with literal commas/
// colons, not URLSearchParams (which would percent-encode BBOX's commas
// and CRS's colon into a much less readable, copy-pasted url).
export const getCoverageUrl = ({
  service,
  coverageName,
  projection,
  format,
  bbox,
  grid,
  dimensionValues,
}: GetCoverageOptions): string => {
  let url =
    `${makeGoodServiceLink(service)}SERVICE=WCS&REQUEST=GetCoverage` +
    `&COVERAGE=${coverageName}&CRS=${encodeURIComponent(projection)}` +
    `&FORMAT=${format}&BBOX=${bbox.left},${bbox.bottom},${bbox.right},${bbox.top}`;

  if (grid.mode === 'cellsize') {
    url += `&RESX=${grid.xResolution}&RESY=${grid.yResolution}`;
  } else {
    url += `&WIDTH=${grid.width}&HEIGHT=${grid.height}`;
  }

  dimensionValues.forEach(({ name, currentValue }) => {
    url += `&${getCoverageDimensionParamName(name)}=${currentValue}`;
  });

  return url;
};
