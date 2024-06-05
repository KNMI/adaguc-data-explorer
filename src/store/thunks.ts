import { createAsyncThunk } from '@reduxjs/toolkit';
import { fetchWMSServiceAsynced } from './promises';

// eslint-disable-next-line import/prefer-default-export
export const fetchWMSService = createAsyncThunk(
  'services/fetchWMSService',
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async (wmsServiceURL: string, _thunkAPI) => {
    return fetchWMSServiceAsynced(wmsServiceURL);
  },
);
