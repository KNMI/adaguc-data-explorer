import { LayerType, generateLayerId } from '@opengeoweb/webmap';

export const baseLayer = {
  name: 'WorldMap_Light_Grey_Canvas',
  title: 'WorldMap_Light_Grey_Canvas',
  type: 'twms',
  layerType: LayerType.baseLayer,
  enabled: true,
  id: generateLayerId(),
};

export const baseLayerWorldMap = {
  name: 'WorldMap',
  title: 'WorldMap',
  type: 'twms',
  layerType: LayerType.baseLayer,
  enabled: true,
  id: generateLayerId(),
};

export const overlayLayer = {
  id: 'countryborder-airmet',
  name: 'countryborders',
  layerType: LayerType.overLayer,
  format: 'image/png',
  enabled: true,
  service: 'https://geoservices.knmi.nl/wms?DATASET=baselayers&',
};
