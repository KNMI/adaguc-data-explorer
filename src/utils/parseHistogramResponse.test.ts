import { parseHistogramResponse } from './parseHistogramResponse';

describe('parseHistogramResponse', () => {
  it('parses a real-shaped adaguc-server GetHistoGram response', () => {
    const json = {
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
        interval: [989.1, 994.5, 999.9],
        quantity: [120, 3400, 24000],
        width: [5.4, 5.4, 5.4],
      },
    };

    expect(parseHistogramResponse(json)).toEqual({
      layerName: 'air_pressure_msl',
      units: 'hPa',
      min: 989.1,
      max: 1024.3,
      average: 1005.2,
      stddev: 7.8,
      bins: [
        { value: 989.1, count: 120 },
        { value: 994.5, count: 3400 },
        { value: 999.9, count: 24000 },
      ],
    });
  });

  it('returns undefined for an empty object', () => {
    expect(parseHistogramResponse({})).toBeUndefined();
  });

  it('returns undefined when interval/quantity are missing or mismatched', () => {
    expect(
      parseHistogramResponse({ air_pressure_msl: { units: 'hPa' } }),
    ).toBeUndefined();
    expect(
      parseHistogramResponse({
        air_pressure_msl: { interval: [1, 2], quantity: [1] },
      }),
    ).toBeUndefined();
  });

  it('returns undefined for non-object input', () => {
    expect(parseHistogramResponse(null)).toBeUndefined();
    expect(parseHistogramResponse('not json')).toBeUndefined();
  });
});
