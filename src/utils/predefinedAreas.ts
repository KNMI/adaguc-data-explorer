import { Bbox } from '@opengeoweb/webmap';

export interface PredefinedArea {
  title: string;
  srs: string;
  bbox: Bbox;
}

// Ported from adaguc-viewer's config.js mapTypeConfiguration (used by its
// MapTypeSelector panel) - the srs/bbox pairs there are the source of
// truth for these preset views, each in its own SRS's native units.
export const predefinedAreas: PredefinedArea[] = [
  {
    title: 'World WGS84',
    srs: 'EPSG:4326',
    bbox: { left: -180, bottom: -90, right: 180, top: 90 },
  },
  {
    title: 'Robinson',
    srs: 'EPSG:54030',
    bbox: {
      left: -17036744.451383516,
      bottom: -10711364.114367772,
      right: 16912038.081015453,
      top: 10488456.659686875,
    },
  },
  {
    title: 'World Mercator',
    srs: 'EPSG:3857',
    bbox: {
      left: -19000000,
      bottom: -19000000,
      right: 19000000,
      top: 19000000,
    },
  },
  {
    title: 'Openstreetmap',
    srs: 'EPSG:3857',
    bbox: {
      left: -19000000,
      bottom: -19000000,
      right: 19000000,
      top: 19000000,
    },
  },
  {
    title: 'Northern Hemisphere',
    srs: 'EPSG:3411',
    bbox: {
      left: -5661541.927991125,
      bottom: -3634073.745615984,
      right: 5795287.923063262,
      top: 2679445.334384017,
    },
  },
  {
    title: 'Southern Hemisphere',
    srs: 'EPSG:3412',
    bbox: {
      left: -4589984.273212382,
      bottom: -2752857.546211313,
      right: 5425154.657417289,
      top: 2986705.2537886878,
    },
  },
  {
    title: 'Europe North Pole',
    srs: 'EPSG:3575',
    bbox: {
      left: -13000000,
      bottom: -13000000,
      right: 13000000,
      top: 13000000,
    },
  },
  {
    // The same bbox adaguc-viewer's Docker/config.js uses for its
    // "Europe stereographic - 5041" variant (EPSG:5041 in place of the
    // plain EPSG:32661 one) - both are "WGS 84 / UPS North", just with
    // 5041 already registered by @opengeoweb/webmap-react out of the box.
    title: 'Europe stereographic',
    srs: 'EPSG:5041',
    bbox: {
      left: -2776118.977564746,
      bottom: -6499490.259201691,
      right: 9187990.785775745,
      top: 971675.53185069,
    },
  },
  {
    title: 'North America',
    srs: 'EPSG:50001',
    bbox: {
      left: -2015360.8716608454,
      bottom: -697107.5349683464,
      right: 9961718.159421016,
      top: 6782157.107682772,
    },
  },
  {
    title: 'Openstreetmap NL',
    srs: 'EPSG:3857',
    bbox: { left: 220000, bottom: 6500000, right: 1000000, top: 7200000 },
  },
  {
    // The standard full-country extent for the Dutch RD New CRS (as used
    // by e.g. PDOK's own default viewports), rather than reusing
    // Openstreetmap NL's Mercator-projected one above.
    title: 'Netherlands - RD NEW',
    srs: 'EPSG:28992',
    bbox: { left: 0, bottom: 300000, right: 280000, top: 625000 },
  },
];

// adaguc-viewer's own thumbnails are live WMS GetMap requests against its
// "countryborders" baselayer (every mapTypeConfiguration entry there has
// an empty baselayer.service, which falls back to that default) - ported
// the same way here rather than vendoring static preview images.
const COUNTRY_BORDERS_SERVICE =
  'https://geoservices.knmi.nl/wms?DATASET=baselayers&';

export const getPredefinedAreaThumbnailUrl = (area: PredefinedArea): string =>
  `${COUNTRY_BORDERS_SERVICE}SERVICE=WMS&REQUEST=GetMap&VERSION=1.1.1&LAYERS=countryborders&STYLES=&FORMAT=image/png&TRANSPARENT=false&WIDTH=160&HEIGHT=120&SRS=${encodeURIComponent(
    area.srs,
  )}&BBOX=${area.bbox.left},${area.bbox.bottom},${area.bbox.right},${area.bbox.top}`;
