import { LayerType, generateLayerId } from '@opengeoweb/webmap';

export const baseLayer = {
  name: 'WorldMap_Light_Grey_Canvas',
  title: 'WorldMap_Light_Grey_Canvas',
  type: 'twms',
  layerType: LayerType.baseLayer,
  enabled: true,
  id: generateLayerId(),
  zIndex: 0,
};

export const baseLayerWorldMap = {
  name: 'WorldMap',
  title: 'WorldMap',
  type: 'twms',
  layerType: LayerType.baseLayer,
  enabled: true,
  id: generateLayerId(),
  zIndex: 0,
};

// Always above the data layers (see DATA_LAYER_BASE_ZINDEX in
// ReduxMapViewComponent.tsx), regardless of how many of those there are.
export const overlayLayer = {
  id: 'countryborder-airmet',
  name: 'countryborders',
  layerType: LayerType.overLayer,
  format: 'image/png',
  enabled: true,
  service: 'https://geoservices.knmi.nl/wms?DATASET=baselayers&',
  zIndex: 10000,
};
