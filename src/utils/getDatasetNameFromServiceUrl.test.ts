import { getDatasetNameFromServiceUrl } from './getDatasetNameFromServiceUrl';

describe('getDatasetNameFromServiceUrl', () => {
  it('extracts the dataset name from a lowercase dataset param', () => {
    expect(
      getDatasetNameFromServiceUrl(
        'https://geoservices.knmi.nl/adagucserver?dataset=adaguc.tests.ahn_utrechtse_heuvelrug_500m&',
      ),
    ).toBe('adaguc.tests.ahn_utrechtse_heuvelrug_500m');
  });

  it('extracts the dataset name regardless of param key casing', () => {
    expect(
      getDatasetNameFromServiceUrl(
        'https://geoservices.knmi.nl/adagucserver?DATASET=RADAR&SERVICE=WMS',
      ),
    ).toBe('RADAR');
  });

  it('returns undefined when there is no dataset param', () => {
    expect(
      getDatasetNameFromServiceUrl('https://example.com/wms?SERVICE=WMS'),
    ).toBeUndefined();
  });

  it('returns undefined for an empty or malformed url', () => {
    expect(getDatasetNameFromServiceUrl('')).toBeUndefined();
    expect(getDatasetNameFromServiceUrl('not a url')).toBeUndefined();
  });
});
