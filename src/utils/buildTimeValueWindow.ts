export interface TimeWindowDimensionLike {
  size(): number;
  getIndexForValue(value: string, outSideOfRangeFlag?: boolean): number;
  // WMJSDimension's own real return type is `string | CustomDate` - kept
  // loose here (rather than `string`) so a live WMLayer's dimension can
  // be passed in directly without an adapter, matching the same
  // TimeDimensionLike pattern getTimeSeriesUrl.ts already uses.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getValueForIndex(index: number): any;
}

// Mirrors adaguc-viewer's legacy WMJSTimeSelector.makeDateList: merges
// every given dimension's own values within windowSize steps of wherever
// currentValue falls in each of them (so a finer-grained layer
// contributes more entries than a coarser one), then re-centers that
// merged, deduplicated, sorted list on currentValue and takes windowSize
// entries around it. This is what lets the TIME panel step through every
// enabled layer's own resolution at once, rather than just one layer's.
export const buildTimeValueWindow = (
  dimensions: TimeWindowDimensionLike[],
  currentValue: string,
  windowSize: number,
): string[] => {
  if (dimensions.length === 0 || windowSize < 1) {
    return [];
  }

  const candidates = new Set<string>();
  dimensions.forEach((dimension) => {
    const size = dimension.size();
    if (size < 1) {
      return;
    }
    const index = dimension.getIndexForValue(currentValue, false);
    for (let t = 0; t < windowSize; t += 1) {
      const forwardIndex = Math.min(Math.max(index + t, 0), size - 1);
      candidates.add(String(dimension.getValueForIndex(forwardIndex)));
      const backwardIndex = Math.min(Math.max(index - t, 0), size - 1);
      candidates.add(String(dimension.getValueForIndex(backwardIndex)));
    }
  });
  // Guarantees currentValue is findable below even if it doesn't exactly
  // match a step in any dimension (e.g. it came from a different layer's
  // own, differently-stepped dimension).
  candidates.add(currentValue);
  const sorted = Array.from(candidates).sort();

  const centerIndex = sorted.indexOf(currentValue);
  const safeCenterIndex =
    centerIndex === -1 ? Math.floor(sorted.length / 2) : centerIndex;

  const windowed = new Set<string>();
  for (let j = 0; j < windowSize; j += 1) {
    const forward = safeCenterIndex + j;
    if (forward < sorted.length) {
      windowed.add(sorted[forward]);
    }
    const backward = safeCenterIndex - j;
    if (backward >= 0) {
      windowed.add(sorted[backward]);
    }
  }
  return Array.from(windowed).sort();
};

// Trims an already-built, sorted value list down to exactly maxLength
// entries, keeping centerValue as close to the middle as the array's own
// edges allow. Used to size the TIME panel's rendered row list to
// whatever actually fits the panel's height, since buildTimeValueWindow
// itself can return up to 2*windowSize-1 entries - more than any one
// fixed row count needs.
export const centerWindow = (
  values: string[],
  centerValue: string,
  maxLength: number,
): string[] => {
  if (maxLength <= 0 || values.length <= maxLength) {
    return values;
  }
  const centerIndex = values.indexOf(centerValue);
  const anchor =
    centerIndex === -1 ? Math.floor(values.length / 2) : centerIndex;
  const start = Math.max(
    0,
    Math.min(
      anchor - Math.floor((maxLength - 1) / 2),
      values.length - maxLength,
    ),
  );
  return values.slice(start, start + maxLength);
};
