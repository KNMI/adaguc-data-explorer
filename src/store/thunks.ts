import { createAsyncThunk } from '@reduxjs/toolkit';
import { LayerType, WMLayer, generateLayerId } from '@opengeoweb/webmap';
import { fetchWMSServiceAsynced } from './promises';
import { selectors } from './selectors';
import { AdagucLayerDimension } from './types';

export interface AddLayerInterface {
  mapId: string;
  name: string;
  serviceUrl: string;
}

export interface AddLayerInterfaceFulFilled {
  mapId: string;
  name: string;
  serviceUrl: string;
  id: string;
  dimensions: AdagucLayerDimension[];
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
    const { serviceUrl, name, mapId } = payload;
    await dispatch(fetchWMSService(serviceUrl));
    const layers = selectors.getAvailableLayers(getState(), serviceUrl);
    const layer = layers.find((layeri) => layeri.name === name);
    if (!layer) {
      return rejectWithValue('Layer not found');
    }
    const id = generateLayerId();
    const wmLayer = new WMLayer({
      id,
      service: serviceUrl,
      name,
      layerType: LayerType.mapLayer,
    });
    await wmLayer.parseLayerPromise();
    return {
      name,
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
