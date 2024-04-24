/* eslint-disable react/jsx-props-no-spreading */
import * as React from 'react';
import {
  LayerProps,
  WMJSService,
  WMGetServiceFromStore,
  getWMLayerById,
} from '@opengeoweb/webmap';
import { Layer } from '@opengeoweb/store/src/store/mapStore/types';
import selectLayer from './selectLayer';

const useLayerFromService = (
  wmsService: string,
): {
  layer: Layer;
  setLayer: (layer: Layer) => void;
  availableLayers: LayerProps[];
  getDimensionValue: (dimensionName: string) => string;
  setDimensionValue: (dimensionName: string, dimensionValue: string) => void;
} => {
  const [layer, setLayer] = React.useState<Layer | null>(null);
  const [availableLayers, setAvailableLayers] = React.useState<LayerProps[]>(
    [],
  );

  const [dimensionValueForName, setDimensionValueForName] = React.useState(
    new Map<string, string>(),
  );
  // const dimMap = new Map<string, string>();
  const setDimensionValue = (
    dimensionName: string,
    dimensionValue: string,
  ): void => {
    setDimensionValueForName(
      new Map(dimensionValueForName.set(dimensionName, dimensionValue)),
    );
  };
  const getDimensionValue = (dimensionName: string): string => {
    return dimensionValueForName.get(dimensionName);
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

  React.useEffect(() => {
    if (layer) {
      const wmLayer = getWMLayerById(layer.id);
      if (wmLayer) {
        const dimensions = wmLayer.getDimensions();
        dimensions.forEach((dimension) => {
          setDimensionValue(dimension.name, dimension.currentValue);
        });
      }
    }
  }, [layer]);
  return {
    layer,
    availableLayers,
    setLayer,
    getDimensionValue,
    setDimensionValue,
  };
};

export default useLayerFromService;
