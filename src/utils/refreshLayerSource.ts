import { WMLayer } from '@opengeoweb/webmap';

interface RefreshableSource {
  refresh: () => void;
}

// Forces OpenLayers to re-fetch a layer's image, bypassing its own
// in-memory source cache. Does not touch the browser's HTTP cache.
// eslint-disable-next-line import/prefer-default-export
export const refreshLayerSource = (wmLayer: WMLayer): void => {
  const olSource = wmLayer.olSource as unknown as RefreshableSource | null;
  olSource?.refresh();
};
