import {
  WMJSDimension,
  WMLayer,
  getWMJSMapById,
  getWMLayerById,
} from '@opengeoweb/webmap';
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
    console.error(`No layer with index ${layerIndex} found for mapId ${mapId}`);
    return null;
  }
  return map.layers[layerIndex];
};

const setDimensionForReduxLayer = (
  reduxLayer: AdagucLayer,
  dimensionName: string,
  dimensionValue: string,
) => {
  if (reduxLayer) {
    const reduxDim = reduxLayer.dimensions.find(
      (dim) => dim.name === dimensionName,
    );
    if (reduxDim) {
      reduxDim.currentValue = dimensionValue;
    } else {
      reduxLayer.dimensions.push({
        name: dimensionName,
        currentValue: dimensionValue,
      });
    }
  }
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
      draftState.maps[mapId] = { layers: [], isAnimating: false };
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
  layerToggleAnimation: (
    draftState: AdagucMapsState,
    action: { payload: { mapId: string; layerIndex: number } },
  ): AdagucMapsState => {
    const { mapId, layerIndex } = action.payload;
    if (!draftState.maps[mapId]?.layers) {
      return;
    }
    const webmap = getWMJSMapById(mapId);
    if (webmap.isAnimating) {
      webmap.stopAnimating();
      draftState.maps[mapId].isAnimating = false;
    } else {
      draftState.maps[mapId].isAnimating = true;
      const layerId = draftState.maps[mapId].layers[layerIndex].id;
      const timeDim = getWMLayerById(layerId).getDimension('time');
      if (timeDim) {
        const currentIndex = timeDim.getIndexForValue(timeDim.currentValue);
        const numSteps = timeDim.size();
        const steps = [];
        for (let j = 0; j < 12; j += 1) {
          const index = currentIndex - 11 + j;
          if (index >= 0 && index < numSteps) {
            steps.push({
              name: 'time',
              value: timeDim.getValueForIndex(index),
            });
          }
        }
        webmap.draw(steps);
      }
    }
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
  layerChangeOpacity: (
    draftState: AdagucMapsState,
    action: {
      payload: { mapId: string; layerIndex: number; opacity: number };
    },
  ): AdagucMapsState => {
    const { mapId, layerIndex, opacity } = action.payload;
    const draftLayer = getReduxLayer(draftState, mapId, layerIndex);
    if (draftLayer) {
      draftLayer.opacity = opacity;
    }
    return draftState;
  },
  layerChangeEnabled: (
    draftState: AdagucMapsState,
    action: {
      payload: { mapId: string; layerIndex: number; enabled: boolean };
    },
  ): AdagucMapsState => {
    const { mapId, layerIndex, enabled } = action.payload;
    const draftLayer = getReduxLayer(draftState, mapId, layerIndex);
    if (draftLayer) {
      draftLayer.enabled = enabled;
    }
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
  updateDims: (
    draftState: AdagucMapsState,
    action: {
      payload: {
        mapId: string;
      };
    },
  ): AdagucMapsState => {
    const { mapId } = action.payload;
    const webmap = getWMJSMapById(mapId);
    const mapLayers = webmap.getLayers();
    mapLayers.forEach((mapLayer, layerIndex) => {
      const draftLayer = getReduxLayer(draftState, mapId, layerIndex);
      if (draftLayer) {
        mapLayer.dimensions.forEach((layerDim) => {
          setDimensionForReduxLayer(
            draftLayer,
            layerDim.name,
            layerDim.currentValue,
          );
        });
      }
    });

    return draftState;
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
    const webmap = getWMJSMapById(mapId);
    webmap.stopAnimating();
    draftState.maps[mapId].isAnimating = false;

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
              setDimensionForReduxLayer(
                reduxLayer,
                layerDim.name,
                layerDim.currentValue,
              );
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
    const {
      serviceUrl,
      name,
      mapId,
      id,
      dimensions,
      enabled,
      styleName,
      opacity,
    } = action.payload;
    const layers = selectors.getAvailableLayers(
      { viewer: draftState },
      serviceUrl,
    );
    const layer = layers.find((layeri) => layeri.name === name);
    if (layer) {
      draftState.maps[mapId].layers.unshift({
        name,
        enabled: enabled || true,
        serviceUrl,
        id,
        style: styleName || layer.styles[0]?.name,
        dimensions,
        opacity: opacity || 1,
      });
    }
  },
};
