/* eslint-disable no-param-reassign */
/* A simple redux store/actions/reducer implementation.
 * A true app would be more complex and separated into different files.
 */
import {
  AnyAction,
  Store,
  ThunkDispatch,
  configureStore,
  createSlice,
} from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import { AdagucMapsState, ViewerState } from './types';
import { fetchWMSService } from './thunks';
import { reducers } from './reducers';

const initialState: AdagucMapsState = {
  maps: { map1: { layers: [] } },
  services: {},
};

/*
 * The store is created here.
 * You can read more about Redux Toolkit's slices in the docs:
 * https://redux-toolkit.js.org/api/createSlice
 */
const ViewerSlice = createSlice({
  name: 'wmsservices',
  initialState,
  reducers,
  extraReducers: (builder) => {
    // Add reducers for additional action types here, and handle loading state as needed
    builder.addCase(fetchWMSService.fulfilled, (state, action) => {
      // Add user to the state array
      const { payload } = action;
      const { id, layers, serviceUrl } = payload;
      state.services[id] = {
        id,
        layers,
        serviceUrl,
      };
    });
  },
});

// The actions contained in the slice are exported for usage in our components
export const { addWMSService } = ViewerSlice.actions;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AppThunkDispatch = ThunkDispatch<ViewerState, any, AnyAction>;

export type AppStore = Omit<Store<ViewerState, AnyAction>, 'dispatch'> & {
  dispatch: AppThunkDispatch;
};

export const useAppDispatch = () => useDispatch<AppThunkDispatch>();
export const useAppSelector: TypedUseSelectorHook<ViewerState> = useSelector;

const store = configureStore({
  reducer: {
    viewer: ViewerSlice.reducer,
  },
});

export default store;
