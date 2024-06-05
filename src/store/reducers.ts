import { AdagucMapsState } from './types';

// eslint-disable-next-line import/prefer-default-export
export const reducers = {
  addWMSService: (
    state: AdagucMapsState,
    action: { payload: { service: string } },
  ): AdagucMapsState => {
    return state;
  },
};
