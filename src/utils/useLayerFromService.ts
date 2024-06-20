/* eslint-disable react/jsx-props-no-spreading */
import * as React from 'react';
import {
  LayerProps,
  WMJSService,
  WMGetServiceFromStore,
  getWMLayerById,
  WMLayer,
  WMJSDimension,
} from '@opengeoweb/webmap';
import { Layer } from '@opengeoweb/store/src/store/mapStore/types';
import selectLayer from './selectLayer';

function updateLayerDimsInMap(wmLayer: WMLayer) {
  const mapLayers = wmLayer.parentMap.getLayers();
  wmLayer.dimensions.forEach((dim) => {
    wmLayer.parentMap.setDimension(dim.name, dim.currentValue, false, false);
  });
  wmLayer.parentMap.mapdimensions.forEach((mapDim: WMJSDimension) => {
    mapLayers.forEach((layer: WMLayer) => {
      layer.dimensions.forEach((layerDim) => {
        if (layerDim.linked === true && layerDim.name === mapDim.name) {
          // if (
          //   mapDim.currentValue === 'current' ||
          //   mapDim.currentValue === 'default' ||
          //   mapDim.currentValue === '' ||
          //   mapDim.currentValue === 'earliest' ||
          //   mapDim.currentValue === 'middle' ||
          //   mapDim.currentValue === 'latest'
          // ) {
          //   mapDim.currentValue = layerDim.getClosestValue(mapDim.currentValue);
          // }
          // console.log(mapDim.currentValue);
          layerDim.setClosestValue(mapDim.currentValue, false);
        }
      });
    });
  });
}
export interface UseLayerFromServiceInterface {
  layer: Layer;
  serviceUrl: string;
  key: string;
  setLayer: (layer: Layer) => void;
  availableLayers: LayerProps[];
  getDimensionValue: (dimensionName: string) => string;
  setDimensionValue: (dimensionName: string, dimensionValue: string) => void;
  update: () => void;
}
const useLayerFromService = (
  wmsService: string,
): UseLayerFromServiceInterface => {
  // State
  const [count, setUpdate] = React.useState(0);
  const [layer, setLayer] = React.useState<Layer | null>(null);
  const [availableLayers, setAvailableLayers] = React.useState<LayerProps[]>(
    [],
  );
  const update = () => {
    setUpdate((count + 1) % 10);
    getWMLayerById(layer?.id)?.parentMap?.draw();
  };
  const setDimensionValue = (
    dimensionName: string,
    dimensionValue: string,
  ): void => {
    const wmLayer = getWMLayerById(layer?.id);
    if (wmLayer) {
      wmLayer.setDimension(dimensionName, dimensionValue, false);

      updateLayerDimsInMap(wmLayer);
      // re-render
      update();
      // Draw map
      wmLayer.parentMap.draw();
    }
  };
  const getDimensionValue = (dimensionName: string): string => {
    return getWMLayerById(layer?.id)?.getDimension(dimensionName)?.currentValue;
  };

  React.useEffect(() => {
    // Load the layers from the WMS service and select the first one
    const service: WMJSService = WMGetServiceFromStore(wmsService);
    service.getLayerObjectsFlat(
      (availableLayersFromService) => {
        setAvailableLayers(availableLayersFromService);
        if (availableLayersFromService.length > 0) {
          selectLayer(availableLayersFromService[0], wmsService)
            .then(setLayer)
            .catch((e) => {
              window.console.error(e);
            });
        }
      },
      () => {},
      false,
    );
  }, []);

  return {
    layer,
    serviceUrl: wmsService,
    key: `${wmsService}_${layer?.id}`,
    availableLayers,
    setLayer,
    getDimensionValue,
    setDimensionValue,
    update,
  };
};

export default useLayerFromService;
