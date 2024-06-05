import { LayerProps } from '@opengeoweb/webmap';
import { createSelector } from '@reduxjs/toolkit';
import { isEqual } from 'lodash';
import { AdagucMapsState, AdagucServices, ViewerState } from './types';

export const selectorMemoizationOptions = {
  memoizeOptions: {
    maxSize: 1000,
    resultEqualityCheck: isEqual,
  },
};

export const getAvailableLayers = createSelector(
  [
    (state: ViewerState) => state?.viewer,
    (_state, serviceUrl: string) => serviceUrl,
  ],
  (viewer: AdagucMapsState, serviceUrl: string): LayerProps[] => {
    const service = Object.values(viewer.services).find(
      (s: AdagucServices) => s.serviceUrl === serviceUrl,
    );
    return service ? service.layers : [];
  },
  selectorMemoizationOptions,
);
