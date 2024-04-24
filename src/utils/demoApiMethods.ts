/* eslint-disable import/prefer-default-export */

export const getWMSServiceUrl = (): string => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return
    if (config && config.wmsServiceUrl) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return config.wmsServiceUrl;
    }
  } catch (e) {
    /* empty */
  }

  return 'https://adaguc-server-ecad-adaguc.pmc.knmi.cloud/adaguc-server?DATASET=eobs_v27.0e&SERVICE=WMS';
};

export const getWMSBaseLayerServiceUrl = (): string => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return
    if (config && config.wmsBaseLayerService) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return config.wmsBaseLayerService;
    }
  } catch (e) {
    /* empty */
  }

  return 'https://adaguc-server-ecad-adaguc.pmc.knmi.cloud/adaguc-server?DATASET=baselayers&SERVICE=WMS';
};
