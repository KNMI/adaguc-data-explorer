import { WMGetServiceFromStore, WMJSService } from '@opengeoweb/webmap';
import { AdagucService } from './types';

// eslint-disable-next-line import/prefer-default-export
export const fetchWMSServiceAsynced = (
  wmsServiceURL: string,
): Promise<AdagucService> => {
  return new Promise<AdagucService>((resolve, reject) => {
    const wmServiceObject: WMJSService = WMGetServiceFromStore(wmsServiceURL);
    wmServiceObject.getLayerObjectsFlat(
      (availableLayersFromService) => {
        return resolve({
          layers: availableLayersFromService.map((layer) => {
            return {
              ...layer,
              serviceUrl: wmsServiceURL,
            };
          }),
          id: wmServiceObject.id,
          serviceUrl: wmsServiceURL,
        });
      },
      (e) => {
        reject(e);
      },
      false,
    );
  });
};
