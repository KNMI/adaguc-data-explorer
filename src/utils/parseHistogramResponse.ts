export interface HistogramBin {
  // Left edge of the bin's value range.
  value: number;
  count: number;
}

export interface HistogramResult {
  layerName: string;
  units?: string;
  min: number;
  max: number;
  average: number;
  stddev: number;
  bins: HistogramBin[];
}

// adaguc-server's GetHistoGram response (CCreateHistogram.cpp) is keyed by
// layer name, with the bins split across two parallel arrays rather than
// one array of {value, count} objects:
// { "<layerName>": { units, layername, min, max, average, stddev,
//     interval: number[] (bin left edges), quantity: number[] (counts) } }
export const parseHistogramResponse = (
  json: unknown,
): HistogramResult | undefined => {
  if (!json || typeof json !== 'object') {
    return undefined;
  }
  const [layerKey] = Object.keys(json);
  if (!layerKey) {
    return undefined;
  }
  const data = (json as Record<string, unknown>)[layerKey];
  if (!data || typeof data !== 'object') {
    return undefined;
  }
  const entry = data as Record<string, unknown>;
  const { interval, quantity } = entry;
  if (
    !Array.isArray(interval) ||
    !Array.isArray(quantity) ||
    interval.length === 0 ||
    interval.length !== quantity.length
  ) {
    return undefined;
  }

  const bins: HistogramBin[] = interval.map((value: number, index) => ({
    value,
    count: quantity[index] as number,
  }));

  return {
    layerName: typeof entry.layername === 'string' ? entry.layername : layerKey,
    units: typeof entry.units === 'string' ? entry.units : undefined,
    min: Number(entry.min),
    max: Number(entry.max),
    average: Number(entry.average),
    stddev: Number(entry.stddev),
    bins,
  };
};
