import { createAsyncThunk } from '@reduxjs/toolkit';
import { LayerType, WMLayer, generateLayerId } from '@opengeoweb/webmap';
import { fetchWMSServiceAsynced } from './promises';
import { selectors } from './selectors';
import { AdagucLayerDimension } from './types';

export interface AddLayerInterface {
  mapId: string;
  name: string;
  serviceUrl: string;
  enabled?: boolean;
  opacity?: string;
  styleName?: string;
}

export interface AddLayerInterfaceFulFilled {
  mapId: string;
  name: string;
  serviceUrl: string;
  id: string;
  dimensions: AdagucLayerDimension[];
  enabled?: boolean;
  opacity?: number;
  styleName?: string;
}

export const fetchWMSService = createAsyncThunk(
  'services/fetchWMSService',
  async (wmsServiceURL: string) => {
    return fetchWMSServiceAsynced(wmsServiceURL);
  },
);

export const addLayer = createAsyncThunk(
  'maps/addLayer',
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async (payload: AddLayerInterface, thunkAPI) => {
    const { dispatch, getState, rejectWithValue } = thunkAPI;
    const { serviceUrl, name, mapId, enabled, styleName, opacity } = payload;
    await dispatch(fetchWMSService(serviceUrl));
    const layers = selectors.getAvailableLayers(getState(), serviceUrl);

    if (layers.length === 0) {
      return rejectWithValue('No layers in service');
    }

    const layerToFind = layers.find((layeri) => layeri.name === name);

    const layerName = layerToFind ? name : layers[0].name;
    const id = generateLayerId();
    const wmLayer = new WMLayer({
      id,
      service: serviceUrl,
      name: layerName,
      layerType: LayerType.mapLayer,
      enabled,
      style: styleName,
    });

    await wmLayer.parseLayerPromise();

    wmLayer.enabled = enabled;
    if (styleName && styleName.length > 0) {
      wmLayer.setStyle(styleName);
    }
    return {
      name: layerName,
      enabled: !!enabled,
      opacity: opacity || 1,
      styleName,
      serviceUrl,
      mapId,
      id,
      dimensions: wmLayer.dimensions.map((dim) => {
        return { name: dim.name, currentValue: dim.currentValue };
      }),
    } as AddLayerInterfaceFulFilled;
  },
);

const thunks = { fetchWMSService, addLayer };
export { thunks };
