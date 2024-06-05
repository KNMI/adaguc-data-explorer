import {
  LayerProps,
  WMGetServiceFromStore,
  WMJSService,
} from '@opengeoweb/webmap';

// eslint-disable-next-line import/prefer-default-export
export const fetchWMSServiceAsynced = (wmsServiceURL: string) => {
  const wmServiceObject: WMJSService = WMGetServiceFromStore(wmsServiceURL);
  return new Promise<{ layers: LayerProps[]; id: string; serviceUrl: string }>(
    (resolve, reject) => {
      wmServiceObject.getLayerObjectsFlat(
        (availableLayersFromService) => {
          return resolve({
            layers: availableLayersFromService,
            id: wmServiceObject.id,
            serviceUrl: wmsServiceURL,
          });
        },
        (e) => {
          reject(e);
        },
        false,
      );
    },
  );
};
