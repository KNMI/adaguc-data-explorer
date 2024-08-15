import { URLEncode, WMBBOX, getWMJSMapById } from '@opengeoweb/webmap';
import { AppThunkDispatch, actions } from '../store/store';
import { thunks } from '../store/thunks';

const addLayers = async (
  layerList: {
    name: string;
    service: string;
    enabled: boolean;
    style: string;
    opacity: string;
    format: string;
  }[],
  mapId: string,
  dispatch: AppThunkDispatch,
) => {
  // eslint-disable-next-line @typescript-eslint/no-misused-promises, no-async-promise-executor
  return new Promise<void>(async (resolve) => {
    // eslint-disable-next-line no-restricted-syntax
    for (const layer of layerList.reverse()) {
      // eslint-disable-next-line no-await-in-loop
      await dispatch(
        thunks.addLayer({
          mapId,
          serviceUrl: layer.service,
          name: layer.name,
          enabled: layer.enabled,
          opacity: layer.opacity,
        }),
      )
        .unwrap()
        .catch((e) => {
          // eslint-disable-next-line no-console
          console.warn(e);
        });
    }

    resolve();
  });
};
// eslint-disable-next-line import/prefer-default-export
export const handleWindowLocationQueryString = (
  mapId: string,
  dispatch: AppThunkDispatch,
) => {
  const lowerCaseUrlParams = new URLSearchParams(window.location.search);

  const srs = lowerCaseUrlParams.get('srs');
  const bbox = lowerCaseUrlParams.get('bbox');
  if (srs && bbox) {
    const map = getWMJSMapById(mapId);
    map.setProjection({ srs, bbox: new WMBBOX(bbox) });
  }

  const services = lowerCaseUrlParams.get('service')?.split(',');
  const layers = lowerCaseUrlParams.get('layer')?.split(',');

  if (layers && services && layers.length > 0) {
    const layerList = layers.map((layer) => {
      const layerProps = layer?.split('$');
      if (layerProps && layerProps.length === 6) {
        const layerName = layerProps[0];
        const layerFormat = layerProps[1];
        const layerEnabled = layerProps[2] !== 'false';
        const layerStyle = layerProps[3];
        const layerOpacity = layerProps[4];
        const layerServiceIndex = parseInt(`${layerProps[5]}`, 10);
        if (layerServiceIndex < services.length) {
          return {
            name: layerName,
            service: services[layerServiceIndex],
            enabled: layerEnabled,
            style: layerStyle,
            opacity: layerOpacity,
            format: layerFormat,
          };
        }
      }
      return null;
    });
    // eslint-disable-next-line no-void
    void addLayers(layerList, mapId, dispatch).then(() => {
      const dims = lowerCaseUrlParams.get('dims')?.split(',');
      if (dims && dims.length > 0 && layerList.length > 0) {
        dims.forEach((dim) => {
          const time = dim.split('$');
          if (time && time.length === 2) {
            const map = getWMJSMapById(mapId);
            map.setDimension(time[0], time[1]);
            const dimensionName = time[0];
            const dimensionValue = time[1];
            dispatch(
              actions.changeLayerDimension({
                mapId,
                layerIndex: 0,
                dimensionName,
                dimensionValue,
              }),
            );
          }
        });
      }
    });
  }
};

export const makePermaLink = (mapId: string): string => {
  const webmap = getWMJSMapById(mapId);
  if (!webmap) return '';
  const currentOrigin = window.location.origin;
  const { srs } = webmap.getProjection();
  const bbox = webmap.getBBOX();
  const projectionLink = `srs=${URLEncode(srs)}&bbox=${bbox.left},${bbox.bottom},${bbox.right},${bbox.top}`;
  const layers = webmap.getLayers();
  const serviceMap = new Set<string>();
  layers.forEach((layer) => {
    serviceMap.add(layer.service);
  });
  const serviceLink = `service=${URLEncode(Array.from(serviceMap).join(','))}`;
  const layersLink = layers
    .map((layer) => {
      const layerName = layer.name;
      const layerFormat = layer.format;
      const layerEnabled = layer.enabled ? 'true' : 'false';
      const layerStyle = layer.getStyle();
      const layerOpacity = layer.opacity;
      const layerServiceIndex = Array.from(serviceMap).findIndex(
        (item) => item === layer.service,
      );
      return `${URLEncode(layerName)}$${URLEncode(layerFormat)}$${layerEnabled}$${URLEncode(layerStyle)}$${layerOpacity}$${layerServiceIndex}`;
    })
    .join(',');

  const dimsLink = webmap
    .getDimensionList()
    .map((dim) => {
      return `${dim.name}$${dim.currentValue}`;
    })
    .join(',');
  return `${currentOrigin}?${projectionLink}&${serviceLink}&layer=${layersLink}&selected=0&dims=${dimsLink}`;
};
