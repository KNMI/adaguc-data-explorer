import { generateLayerId } from '@opengeoweb/webmap';

export const baseLayer = {
  name: 'WorldMap_Light_Grey_Canvas',
  title: 'WorldMap_Light_Grey_Canvas',
  type: 'twms',
  baseLayer: true,
  enabled: true,
  id: generateLayerId(),
};

export const baseLayerWorldMap = {
  name: 'WorldMap',
  title: 'WorldMap',
  type: 'twms',
  baseLayer: true,
  enabled: true,
  id: generateLayerId(),
};
