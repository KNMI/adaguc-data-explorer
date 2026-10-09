import { getWMSServiceId, queryWMSLayers } from '@opengeoweb/webmap';
import { AdagucService } from './types';

// eslint-disable-next-line import/prefer-default-export
export const fetchWMSServiceAsynced = async (
  wmsServiceURL: string,
): Promise<AdagucService> => {
  const availableLayersFromService = await queryWMSLayers(wmsServiceURL);
  return {
    layers: availableLayersFromService.map((layer) => {
      return {
        ...layer,
        serviceUrl: wmsServiceURL,
      };
    }),
    id: getWMSServiceId(wmsServiceURL),
    serviceUrl: wmsServiceURL,
  };
};
