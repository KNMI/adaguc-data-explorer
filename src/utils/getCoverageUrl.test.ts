import { getCoverageUrl } from './getCoverageUrl';

const baseOptions = {
  service: 'https://geoservices.knmi.nl/adagucserver?dataset=test&',
  coverageName: 'air_pressure_msl',
  projection: 'EPSG:4326',
  format: 'AAIGRID',
  bbox: { left: -10, bottom: 40, right: 10, top: 60 },
  dimensionValues: [],
};

describe('getCoverageUrl', () => {
  it('builds a GetCoverage url with cell-size grid properties', () => {
    const url = getCoverageUrl({
      ...baseOptions,
      grid: { mode: 'cellsize', xResolution: 0.5, yResolution: 0.25 },
    });

    expect(url).toBe(
      'https://geoservices.knmi.nl/adagucserver?dataset=test&SERVICE=WCS&REQUEST=GetCoverage' +
        '&COVERAGE=air_pressure_msl&CRS=EPSG%3A4326&FORMAT=AAIGRID&BBOX=-10,40,10,60' +
        '&RESX=0.5&RESY=0.25',
    );
  });

  it('builds a GetCoverage url with raster-size grid properties', () => {
    const url = getCoverageUrl({
      ...baseOptions,
      grid: { mode: 'rastersize', width: 400, height: 200 },
    });

    expect(url).toContain('&WIDTH=400&HEIGHT=200');
    expect(url).not.toContain('RESX');
  });

  it('appends TIME/ELEVATION dimensions by their own name, others with a DIM_ prefix', () => {
    const url = getCoverageUrl({
      ...baseOptions,
      grid: { mode: 'rastersize', width: 400, height: 200 },
      dimensionValues: [
        { name: 'time', currentValue: '2024-01-01T00:00:00Z' },
        { name: 'elevation', currentValue: '1000' },
        { name: 'member', currentValue: 'member3' },
      ],
    });

    expect(url).toContain('&TIME=2024-01-01T00:00:00Z');
    expect(url).toContain('&ELEVATION=1000');
    expect(url).toContain('&DIM_MEMBER=member3');
  });

  it('adds a separator when the service url has no trailing ? or &', () => {
    const url = getCoverageUrl({
      ...baseOptions,
      service: 'https://example.com/wcs',
      grid: { mode: 'rastersize', width: 400, height: 200 },
    });

    expect(url.startsWith('https://example.com/wcs?SERVICE=WCS')).toBe(true);
  });
});
