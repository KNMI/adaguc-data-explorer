import {
  predefinedAreas,
  getPredefinedAreaThumbnailUrl,
} from './predefinedAreas';

describe('predefinedAreas', () => {
  it('lists the areas shown by adaguc-viewer, in the same order', () => {
    expect(predefinedAreas.map((area) => area.title)).toEqual([
      'World WGS84',
      'Robinson',
      'World Mercator',
      'Openstreetmap',
      'Northern Hemisphere',
      'Southern Hemisphere',
      'Europe North Pole',
      'Europe stereographic',
      'North America',
      'Openstreetmap NL',
      'Netherlands - RD NEW',
    ]);
  });

  it('uses EPSG:5041 for Europe stereographic, not EPSG:32661', () => {
    // EPSG:5041 is already registered by @opengeoweb/webmap-react out of
    // the box, unlike EPSG:32661 - same "WGS 84 / UPS North" projection
    // and identical bbox (per adaguc-viewer's Docker/config.js, which
    // offers both as separate presets), just without needing this app to
    // register its own proj4 definition for it.
    const area = predefinedAreas.find(
      (a) => a.title === 'Europe stereographic',
    );
    expect(area?.srs).toBe('EPSG:5041');
  });

  it('adds a Netherlands preset in the Dutch RD New CRS', () => {
    const area = predefinedAreas.find(
      (a) => a.title === 'Netherlands - RD NEW',
    );
    expect(area?.srs).toBe('EPSG:28992');
    expect(area?.bbox).toEqual({
      left: 0,
      bottom: 300000,
      right: 280000,
      top: 625000,
    });
  });
});

describe('getPredefinedAreaThumbnailUrl', () => {
  it('builds a GetMap request against the countryborders baselayer, in the area own srs/bbox', () => {
    const url = getPredefinedAreaThumbnailUrl({
      title: 'World WGS84',
      srs: 'EPSG:4326',
      bbox: { left: -180, bottom: -90, right: 180, top: 90 },
    });

    expect(url).toBe(
      'https://geoservices.knmi.nl/wms?DATASET=baselayers&SERVICE=WMS&REQUEST=GetMap&VERSION=1.1.1&LAYERS=countryborders&STYLES=&FORMAT=image/png&TRANSPARENT=false&WIDTH=160&HEIGHT=120&SRS=EPSG%3A4326&BBOX=-180,-90,180,90',
    );
  });
});
