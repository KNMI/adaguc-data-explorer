/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable react/jsx-props-no-spreading */
import { Layer } from '@opengeoweb/store/src/store/mapStore/types';
import {
  WMLayer,
  LayerProps,
  generateLayerId,
  registerWMLayer,
  LayerType,
} from '@opengeoweb/webmap';

const selectLayer = (
  selectedLayer: LayerProps,
  wmsService: string,
): Promise<Layer> => {
  return new Promise((resolveLayer) => {
    console.log('resolve');
    const wmsLayer = {
      service: wmsService,
      name: selectedLayer.name,
      id: generateLayerId(),
      format: 'image/webp',
      enabled: true,
      layerType: LayerType.mapLayer,
    };
    const wmLayer = new WMLayer(wmsLayer);
    registerWMLayer(wmLayer, wmsLayer.id);
    wmLayer.parseLayer(
      () => {
        resolveLayer(wmsLayer);
      },
      false,
      'selectLayer.ts',
    );
  });
};
export default selectLayer;
