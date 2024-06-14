import { WMJSDimension, WMLayer, getWMLayerById } from '@opengeoweb/webmap';
import { AdagucLayer, AdagucMapsState, AdagucService } from './types';
import { AddLayerInterfaceFulFilled } from './thunks';
import { selectors } from './selectors';

const getReduxLayer = (
  draftState: AdagucMapsState,
  mapId: string,
  layerIndex: number,
): AdagucLayer | null => {
  const map = draftState.maps[mapId];
  if (!map || !map.layers[layerIndex]) {
    // eslint-disable-next-line no-console
    console.error(`No layer ${layerIndex} found for mapId ${mapId}`);
    return null;
  }
  return map.layers[layerIndex];
};

const getServiceByServiceUrl = (
  draftState: AdagucMapsState,
  serviceUrl: string,
): AdagucService | null => {
  const service = Object.values(draftState.services).find(
    (s) => s.serviceUrl === serviceUrl,
  );
  return service;
};

// eslint-disable-next-line import/prefer-default-export
export const reducers = {
  registerMap: (
    draftState: AdagucMapsState,
    action: { payload: { mapId: string } },
  ): AdagucMapsState => {
    const { mapId } = action.payload;
    if (!draftState.maps[mapId]) {
      draftState.maps[mapId] = { layers: [] };
    }
    return draftState;
  },
  setLayerOrderByIds: (
    draftState: AdagucMapsState,
    action: { payload: { mapId: string; layerListIds: string[] } },
  ): AdagucMapsState => {
    const { mapId, layerListIds } = action.payload;
    if (!draftState.maps[mapId]?.layers) {
      return;
    }
    const newLayerListOrder = layerListIds.map(
      (idToFind: string): AdagucLayer => {
        return draftState.maps[mapId].layers.find(
          (layerToFind) => layerToFind.id === idToFind,
        );
      },
    );
    draftState.maps[mapId].layers = newLayerListOrder;
  },
  removeLayer: (
    draftState: AdagucMapsState,
    action: { payload: { mapId: string; layerIndex: number } },
  ): AdagucMapsState => {
    const { mapId, layerIndex } = action.payload;
    if (!draftState.maps[mapId]?.layers) {
      return;
    }
    draftState.maps[mapId].layers.splice(layerIndex, 1);
  },
  removeAllLayers: (
    draftState: AdagucMapsState,
    action: { payload: { mapId: string } },
  ): AdagucMapsState => {
    const { mapId } = action.payload;
    if (!draftState.maps[mapId]?.layers) {
      return;
    }
    draftState.maps[mapId].layers.length = 0;
  },
  changeLayerStyle: (
    draftState: AdagucMapsState,
    action: {
      payload: { mapId: string; layerIndex: number; styleName: string };
    },
  ): AdagucMapsState => {
    const { mapId, layerIndex, styleName } = action.payload;
    const draftLayer = getReduxLayer(draftState, mapId, layerIndex);
    const styleList = selectors.getStyleListForLayer(
      { viewer: draftState },
      draftLayer,
    );
    const exists = styleList.find((style) => style.name === styleName);
    const newStyleName = styleList.length > 0 ? styleList[0].name : 'default';
    draftLayer.style = exists ? styleName : newStyleName;

    return draftState;
  },
  changeLayerName: (
    draftState: AdagucMapsState,
    action: {
      payload: { mapId: string; layerIndex: number; layerName: string };
    },
  ): AdagucMapsState => {
    const { mapId, layerIndex, layerName } = action.payload;
    const draftLayer = getReduxLayer(draftState, mapId, layerIndex);
    if (!draftLayer) {
      return;
    }
    const service = getServiceByServiceUrl(draftState, draftLayer.serviceUrl);
    const newLayer = service.layers.find((l) => l.name === layerName);
    draftLayer.name = newLayer.name;
    const newStyle = draftLayer.style || newLayer.styles[0]?.name;
    reducers.changeLayerStyle(draftState, {
      payload: { mapId, layerIndex, styleName: newStyle },
    });
  },
  changeLayerDimension: (
    draftState: AdagucMapsState,
    action: {
      payload: {
        mapId: string;
        layerIndex: number;
        dimensionName: string;
        dimensionValue: string;
      };
    },
  ): AdagucMapsState => {
    const { mapId, layerIndex, dimensionName, dimensionValue } = action.payload;
    const draftLayer = getReduxLayer(draftState, mapId, layerIndex);
    if (!draftLayer) {
      return;
    }

    const updateLayerDimsInMap = (wmLayer: WMLayer) => {
      const mapLayers = wmLayer.parentMap.getLayers();
      wmLayer.dimensions.forEach((dim) => {
        wmLayer.parentMap.setDimension(
          dim.name,
          dim.currentValue,
          false,
          false,
        );
      });
      wmLayer.parentMap.mapdimensions.forEach((mapDim: WMJSDimension) => {
        mapLayers.forEach((layer: WMLayer, i) => {
          layer.dimensions.forEach((layerDim) => {
            if (layerDim.linked === true && layerDim.name === mapDim.name) {
              layerDim.setClosestValue(mapDim.currentValue, false);
              const reduxLayer = draftState.maps[mapId].layers[i];
              if (reduxLayer) {
                const reduxDim = reduxLayer.dimensions.find(
                  (dim) => dim.name === layerDim.name,
                );
                if (reduxDim) {
                  reduxDim.currentValue = layerDim.currentValue;
                } else {
                  draftLayer.dimensions.push({
                    name: layerDim.name,
                    currentValue: layerDim.currentValue,
                  });
                }
              }
            }
          });
        });
      });
    };

    const wmLayer = getWMLayerById(draftLayer.id);
    if (wmLayer) {
      wmLayer.setDimension(dimensionName, dimensionValue, false);
      updateLayerDimsInMap(wmLayer);
      wmLayer.parentMap.draw();
    }

    const draftDim = draftLayer.dimensions.find(
      (dim) => dim.name === dimensionName,
    );
    if (draftDim) {
      draftDim.currentValue = dimensionValue;
    } else {
      draftLayer.dimensions.push({
        name: dimensionName,
        currentValue: dimensionValue,
      });
    }
  },
  fullFillfetchWMSService: (
    draftState: AdagucMapsState,
    action: { payload: AdagucService },
  ): void => {
    const { payload } = action;
    const { id, layers, serviceUrl } = payload;
    draftState.services[id] = {
      id,
      layers,
      serviceUrl,
    };
  },
  fullFillAddLayer: (
    draftState: AdagucMapsState,
    action: { payload: AddLayerInterfaceFulFilled },
  ): void => {
    reducers.registerMap(draftState, action);
    const { serviceUrl, name, mapId, id, dimensions } = action.payload;
    const layers = selectors.getAvailableLayers(
      { viewer: draftState },
      serviceUrl,
    );
    const layer = layers.find((layeri) => layeri.name === name);
    if (layer) {
      draftState.maps[mapId].layers.push({
        name,
        serviceUrl,
        id,
        style: layer.styles[0]?.name,
        dimensions,
      });
    }
  },
};
