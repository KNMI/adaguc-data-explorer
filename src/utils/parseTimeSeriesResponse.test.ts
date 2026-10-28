import { parseTimeSeriesResponse } from './parseTimeSeriesResponse';

describe('parseTimeSeriesResponse', () => {
  it('parses a flat response with no extra dimensions (dims: ["time"])', () => {
    const response = [
      {
        name: 'air_pressure_msl',
        standard_name: 'air_pressure_at_mean_sea_level',
        units: 'hPa',
        dims: ['time'],
        data: {
          '2025-11-21T01:00:00Z': '1023.815613',
          '2025-11-21T02:00:00Z': '1023.326904',
        },
      },
    ];

    expect(parseTimeSeriesResponse(response)).toEqual({
      standardName: 'air_pressure_at_mean_sea_level',
      units: 'hPa',
      series: [
        {
          seriesName: '',
          points: [
            { time: '2025-11-21T01:00:00Z', value: 1023.815613 },
            { time: '2025-11-21T02:00:00Z', value: 1023.326904 },
          ],
        },
      ],
    });
  });

  // Regression guard: real response from geoservices.knmi.nl RADAR
  // Reflectivity - the server sends dims as a bare string rather than a
  // one-element array when there's no series dimension, which used to
  // throw (dims.findIndex is not a function) and surface as a generic
  // "Failed to load timeseries" with no real explanation.
  it('parses a response whose dims is a bare string (not an array) when there is no series dimension', () => {
    const response = [
      {
        name: 'Reflectivity',
        layername: 'Reflectivity',
        variablename: 'image1.image_data',
        standard_name: 'image1.image_data',
        units: 'dBZ',
        dims: 'time',
        data: {
          '2026-10-28T08:25:00Z': '10.000000',
          '2026-10-28T08:30:00Z': '11.000000',
        },
      },
    ];

    expect(parseTimeSeriesResponse(response)).toEqual({
      standardName: 'image1.image_data',
      units: 'dBZ',
      series: [
        {
          seriesName: '',
          points: [
            { time: '2026-10-28T08:25:00Z', value: 10 },
            { time: '2026-10-28T08:30:00Z', value: 11 },
          ],
        },
      ],
    });
  });

  // Real response from adaguc.tests.wikgeneric air_pressure_msl, nested one
  // level deep as reference_time -> time -> value.
  it('parses a response nested one level deep (dims: ["reference_time", "time"])', () => {
    const response = [
      {
        name: 'air_pressure_msl',
        layername: 'air_pressure_msl',
        variablename: 'air-pressure-msl',
        standard_name: 'air_pressure_at_mean_sea_level',
        units: 'hPa',
        point: { SRS: 'EPSG:4326', coords: '-7.873794,57.231584' },
        dims: ['reference_time', 'time'],
        data: {
          '2025-11-21T00:00:00Z': {
            '2025-11-21T01:00:00Z': '1023.815613',
            '2025-11-21T02:00:00Z': '1023.326904',
            '2025-11-21T03:00:00Z': '1023.036255',
          },
        },
      },
    ];

    expect(parseTimeSeriesResponse(response)).toEqual({
      standardName: 'air_pressure_at_mean_sea_level',
      units: 'hPa',
      series: [
        {
          seriesName: '',
          points: [
            { time: '2025-11-21T01:00:00Z', value: 1023.815613 },
            { time: '2025-11-21T02:00:00Z', value: 1023.326904 },
            { time: '2025-11-21T03:00:00Z', value: 1023.036255 },
          ],
        },
      ],
    });
  });

  // Real response from uwcw_ha43_dini_sounding air-temperature-ml, nested
  // two levels deep as reference_time -> elevation -> time -> value, and
  // with units reported as an empty object rather than a string.
  it('parses a response nested two levels deep (dims: ["reference_time", "elevation", "time"])', () => {
    const response = [
      {
        name: 'air-temperature-ml',
        layername: 'air-temperature-ml',
        variablename: 'air-temperature-ml',
        standard_name: 'air_temperature',
        units: {},
        point: { SRS: 'EPSG:4326', coords: '-3.994656,56.556707' },
        dims: ['reference_time', 'elevation', 'time'],
        data: {
          '2026-10-11T15:00:00Z': {
            '90': {
              '2026-10-11T17:00:00Z': '7.300000',
              '2026-10-11T18:00:00Z': '6.300000',
              '2026-10-11T19:00:00Z': '5.900000',
            },
          },
        },
      },
    ];

    expect(parseTimeSeriesResponse(response)).toEqual({
      standardName: 'air_temperature',
      units: undefined,
      series: [
        {
          seriesName: '',
          points: [
            { time: '2026-10-11T17:00:00Z', value: 7.3 },
            { time: '2026-10-11T18:00:00Z', value: 6.3 },
            { time: '2026-10-11T19:00:00Z', value: 5.9 },
          ],
        },
      ],
    });
  });

  // Real response from uwcw-ha-ens-nl-2km air_temperature_percentiles_hagl,
  // requested with DIM_PERCENTILE widened to a range (0/100) the same way
  // getTimeSeriesUrl widens TIME, so every percentile comes back nested
  // under reference_time in one response: dims: ["reference_time",
  // "percentile", "time"].
  it('splits a percentile dimension into one series per percentile', () => {
    const response = [
      {
        name: 'air_temperature_percentiles_hagl',
        standard_name: 'air_temperature',
        units: 'C',
        dims: ['reference_time', 'percentile', 'time'],
        data: {
          '2026-10-11T16:00:00Z': {
            '0': {
              '2026-10-11T17:00:00Z': '7.242584',
              '2026-10-11T18:00:00Z': '6.849274',
            },
            '50': {
              '2026-10-11T17:00:00Z': '7.628937',
              '2026-10-11T18:00:00Z': '7.802155',
            },
            '100': {
              '2026-10-11T17:00:00Z': '8.216461',
              '2026-10-11T18:00:00Z': '8.224030',
            },
          },
        },
      },
    ];

    expect(parseTimeSeriesResponse(response)).toEqual({
      standardName: 'air_temperature',
      units: 'C',
      seriesDimensionName: 'percentile',
      series: [
        {
          seriesName: '0',
          points: [
            { time: '2026-10-11T17:00:00Z', value: 7.242584 },
            { time: '2026-10-11T18:00:00Z', value: 6.849274 },
          ],
        },
        {
          seriesName: '50',
          points: [
            { time: '2026-10-11T17:00:00Z', value: 7.628937 },
            { time: '2026-10-11T18:00:00Z', value: 7.802155 },
          ],
        },
        {
          seriesName: '100',
          points: [
            { time: '2026-10-11T17:00:00Z', value: 8.216461 },
            { time: '2026-10-11T18:00:00Z', value: 8.22403 },
          ],
        },
      ],
    });
  });

  it('orders percentile/member series numerically, not lexicographically', () => {
    const response = [
      {
        standard_name: 'air_temperature',
        units: 'C',
        dims: ['percentile', 'time'],
        data: {
          '100': { '2025-01-01T00:00:00Z': '3.0' },
          '0': { '2025-01-01T00:00:00Z': '1.0' },
          '10': { '2025-01-01T00:00:00Z': '2.0' },
        },
      },
    ];

    expect(
      parseTimeSeriesResponse(response)?.series.map((s) => s.seriesName),
    ).toEqual(['0', '10', '100']);
  });

  it('falls back to a single series if the series dimension has no usable data', () => {
    const response = [
      {
        standard_name: 'air_temperature',
        units: 'C',
        dims: ['percentile', 'time'],
        data: {},
      },
    ];

    expect(parseTimeSeriesResponse(response)).toBeUndefined();
  });

  it('sorts points chronologically regardless of key order in the response', () => {
    const response = [
      {
        standard_name: 'air_temperature',
        units: 'K',
        data: {
          '2025-01-01T02:00:00Z': '2.000000',
          '2025-01-01T00:00:00Z': '0.000000',
          '2025-01-01T01:00:00Z': '1.000000',
        },
      },
    ];

    expect(
      parseTimeSeriesResponse(response)?.series[0].points.map((p) => p.time),
    ).toEqual([
      '2025-01-01T00:00:00Z',
      '2025-01-01T01:00:00Z',
      '2025-01-01T02:00:00Z',
    ]);
  });

  it('drops points whose value cannot be parsed as a finite number', () => {
    const response = [
      {
        standard_name: 'air_temperature',
        units: 'K',
        data: {
          '2025-01-01T00:00:00Z': '1.000000',
          '2025-01-01T01:00:00Z': 'NaN',
          '2025-01-01T02:00:00Z': '3.000000',
        },
      },
    ];

    expect(parseTimeSeriesResponse(response)?.series[0].points).toEqual([
      { time: '2025-01-01T00:00:00Z', value: 1 },
      { time: '2025-01-01T02:00:00Z', value: 3 },
    ]);
  });

  it('returns undefined for an empty array response', () => {
    expect(parseTimeSeriesResponse([])).toBeUndefined();
  });

  it('returns undefined when the response is not an array', () => {
    expect(parseTimeSeriesResponse({ data: {} })).toBeUndefined();
    expect(parseTimeSeriesResponse(null)).toBeUndefined();
    expect(parseTimeSeriesResponse(undefined)).toBeUndefined();
  });

  it('returns undefined when the entry has no usable data', () => {
    expect(parseTimeSeriesResponse([{ standard_name: 'x' }])).toBeUndefined();
    expect(
      parseTimeSeriesResponse([{ standard_name: 'x', data: {} }]),
    ).toBeUndefined();
  });
});
