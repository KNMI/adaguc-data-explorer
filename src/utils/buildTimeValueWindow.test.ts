import {
  buildTimeValueWindow,
  centerWindow,
  TimeWindowDimensionLike,
} from './buildTimeValueWindow';

const makeDimension = (values: string[]): TimeWindowDimensionLike => ({
  size: () => values.length,
  getIndexForValue: (value: string) => {
    const index = values.indexOf(value);
    // Mirrors WMJSDimension.getIndexForValue's own "always return a
    // valid index" contract when outSideOfRangeFlag is false.
    return index === -1 ? 0 : index;
  },
  getValueForIndex: (index: number) => values[index],
});

// Zero-padded so plain string sort (what buildTimeValueWindow itself uses,
// matching real fixed-width ISO date strings) matches numeric order -
// "t10" would otherwise sort before "t6".
const makeIndexedValues = (length: number): string[] =>
  Array.from({ length }, (_, i) => `t${String(i).padStart(2, '0')}`);

describe('buildTimeValueWindow', () => {
  it('returns an empty list when there are no dimensions', () => {
    expect(buildTimeValueWindow([], 't5', 4)).toEqual([]);
  });

  it('returns an empty list when windowSize is 0 or negative', () => {
    const dim = makeDimension(['t0', 't1', 't2']);
    expect(buildTimeValueWindow([dim], 't1', 0)).toEqual([]);
    expect(buildTimeValueWindow([dim], 't1', -1)).toEqual([]);
  });

  it('centers the window on currentValue for a single dimension', () => {
    // windowSize is a two-sided radius applied twice (once gathering raw
    // candidates per dimension, again re-centering the merged result) -
    // for one dimension far from either edge, both passes expand around
    // the same center, so the result ends up spanning the full
    // 2*windowSize-1 neighbourhood, not just windowSize entries.
    const dim = makeDimension(makeIndexedValues(11));

    expect(buildTimeValueWindow([dim], 't05', 5)).toEqual([
      't01',
      't02',
      't03',
      't04',
      't05',
      't06',
      't07',
      't08',
      't09',
    ]);
  });

  it('clamps instead of going negative when currentValue is near the start', () => {
    const dim = makeDimension(makeIndexedValues(11));

    expect(buildTimeValueWindow([dim], 't00', 5)).toEqual([
      't00',
      't01',
      't02',
      't03',
      't04',
    ]);
  });

  it('clamps instead of overrunning the end when currentValue is near the end', () => {
    const dim = makeDimension(makeIndexedValues(11));

    expect(buildTimeValueWindow([dim], 't10', 5)).toEqual([
      't06',
      't07',
      't08',
      't09',
      't10',
    ]);
  });

  it("merges several dimensions' own values, so a finer-grained layer contributes more entries than a coarser one", () => {
    // Regression guard: this is the whole point of this function - a
    // hand-rolled "just use one layer's dimension" implementation would
    // miss the finer layer's in-between steps entirely.
    const hourly = makeDimension([
      '2025-01-01T00:00:00Z',
      '2025-01-01T01:00:00Z',
      '2025-01-01T02:00:00Z',
    ]);
    const everyTenMinutes = makeDimension([
      '2025-01-01T00:40:00Z',
      '2025-01-01T00:50:00Z',
      '2025-01-01T01:00:00Z',
      '2025-01-01T01:10:00Z',
      '2025-01-01T01:20:00Z',
    ]);

    const result = buildTimeValueWindow(
      [hourly, everyTenMinutes],
      '2025-01-01T01:00:00Z',
      6,
    );

    // All 7 merged entries, including the hourly dimension's own
    // 00:00/02:00 - with only the hourly dimension given, those would be
    // the only neighbours found at all.
    expect(result).toEqual([
      '2025-01-01T00:00:00Z',
      '2025-01-01T00:40:00Z',
      '2025-01-01T00:50:00Z',
      '2025-01-01T01:00:00Z',
      '2025-01-01T01:10:00Z',
      '2025-01-01T01:20:00Z',
      '2025-01-01T02:00:00Z',
    ]);
  });

  it('ignores a dimension with no values instead of throwing', () => {
    const empty = makeDimension([]);
    const dim = makeDimension(['t0', 't1', 't2']);

    expect(buildTimeValueWindow([empty, dim], 't1', 3)).toEqual([
      't0',
      't1',
      't2',
    ]);
  });
});

describe('centerWindow', () => {
  const values = makeIndexedValues(11); // t00..t10

  it('returns the input unchanged when it already fits within maxLength', () => {
    expect(centerWindow(values, 't05', 11)).toEqual(values);
    expect(centerWindow(values, 't05', 20)).toEqual(values);
  });

  it('returns the input unchanged when maxLength is 0 or negative', () => {
    expect(centerWindow(values, 't05', 0)).toEqual(values);
    expect(centerWindow(values, 't05', -1)).toEqual(values);
  });

  it('centers the trimmed window on centerValue away from either edge', () => {
    expect(centerWindow(values, 't05', 5)).toEqual([
      't03',
      't04',
      't05',
      't06',
      't07',
    ]);
  });

  it('clamps instead of going negative when centerValue is near the start', () => {
    expect(centerWindow(values, 't01', 5)).toEqual([
      't00',
      't01',
      't02',
      't03',
      't04',
    ]);
  });

  it('clamps instead of overrunning the end when centerValue is near the end', () => {
    expect(centerWindow(values, 't09', 5)).toEqual([
      't06',
      't07',
      't08',
      't09',
      't10',
    ]);
  });

  it('falls back to the middle of the array when centerValue is not present', () => {
    expect(centerWindow(values, 'missing', 3)).toEqual(['t04', 't05', 't06']);
  });
});
