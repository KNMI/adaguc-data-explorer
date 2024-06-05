/* eslint-disable @typescript-eslint/no-floating-promises */
import * as React from 'react';
import { LayerProps } from '@opengeoweb/webmap';
import { useAppDispatch, useAppSelector } from '../store/store';
import { fetchWMSService } from '../store/thunks';
import WMSLayerSelector from './WMSComponents/WMSLayerSelector';
import * as selectors from '../store/selectors';
import { ViewerState } from '../store/types';

const ReduxLayerSelector = (): React.ReactElement => {
  const dispatch = useAppDispatch();
  const service =
    'https://geoservices.knmi.nl/adaguc-server?DATASET=RADAR&SERVICE=WMS&';

  // Fetch WMS service from redux store
  React.useEffect(() => {
    dispatch(fetchWMSService(service));
  }, []);

  // Read available layers from redux store
  const availableLayers = useAppSelector((state: ViewerState): LayerProps[] =>
    selectors.getAvailableLayers(state, service),
  );

  // Local state for tracking which layer was selected
  const [layer, setLayer] = React.useState<LayerProps | null>(null);

  // Set first layer as default
  React.useEffect(() => {
    if (layer === null && availableLayers.length > 0) {
      setLayer(availableLayers[0]);
    }
  }, [availableLayers]);

  return (
    <WMSLayerSelector
      layer={layer}
      layers={availableLayers}
      onSelectLayer={(selectedLayer) => {
        setLayer(selectedLayer);
      }}
    />
  );
};

export default ReduxLayerSelector;
