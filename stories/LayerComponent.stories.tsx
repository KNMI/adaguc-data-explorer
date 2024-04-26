/* eslint-disable react/jsx-props-no-spreading */
import * as React from 'react';
import { ThemeWrapper } from '@opengeoweb/theme';
import { styled } from '@mui/material/styles';
import { Grid, Paper } from '@mui/material';
import { webmapUtils } from '@opengeoweb/webmap';
import { MapView, MapViewLayer } from '@opengeoweb/webmap-react';
import LayerSelector from '../src/components/LayerComponent/WMSLayerSelector';
import selectLayer from '../src/utils/selectLayer';
import useLayerFromService, {
  UseLayerFromServiceInterface,
} from '../src/utils/useLayerFromService';
import { LayerComponent } from '../src/components/LayerComponent/LayerComponent';
import { baseLayerWorldMap } from '../src/utils/layerDefinitions';

const Item = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? '#1A2027' : '#fff',
  ...theme.typography.body2,
  padding: theme.spacing(0),
  textAlign: 'center',
  color: theme.palette.text.secondary,
}));

export const LayerSelectorStory = (): React.ReactElement => {
  const wmsService =
    'https://adaguc-server-ecad-adaguc.pmc.knmi.cloud/adaguc-server?DATASET=eobs_v27.0e&SERVICE=WMS';

  const { layer, availableLayers, setLayer } = useLayerFromService(wmsService);
  return (
    <ThemeWrapper>
      <Grid container direction="column" style={{ background: 'white' }}>
        <LayerSelector
          layer={layer}
          layers={availableLayers}
          onSelectLayer={(selectedLayer) => {
            selectLayer(selectedLayer, wmsService)
              .then(setLayer)
              .catch((e) => {
                window.console.error(e);
              });
          }}
        />
      </Grid>
    </ThemeWrapper>
  );
};

LayerSelectorStory.storyName = 'LayerSelector';

export const LayerComponentStory = (): React.ReactElement => {
  const serviceUrl =
    'https://geoservices.knmi.nl/adaguc-server?DATASET=HARM_N25&SERVICE=WMS&';

  const {
    layer,
    availableLayers,
    setLayer,
    getDimensionValue,
    setDimensionValue,
  } = useLayerFromService(serviceUrl);

  return (
    <LayerComponent
      serviceUrl={serviceUrl}
      layer={layer}
      availableLayers={availableLayers}
      setLayer={setLayer}
      getDimensionValue={getDimensionValue}
      setDimensionValue={setDimensionValue}
    />
  );
};
LayerComponentStory.storyName = 'LayerComponent';

export const LayerListComponentStory = (): React.ReactElement => {
  const layerList: UseLayerFromServiceInterface[] = [
    useLayerFromService(
      'https://geoservices.knmi.nl/adaguc-server?DATASET=RADAR&SERVICE=WMS&',
    ),
    useLayerFromService(
      'https://geoservices.knmi.nl/adaguc-server?DATASET=HARM_N25&SERVICE=WMS&',
    ),
  ];

  const mapId = React.useRef<string>(webmapUtils.generateMapId()).current;
  return (
    <Grid container style={{ height: '80vh', background: 'grey' }}>
      <Grid item xs={3} style={{ height: '100%' }}>
        <Item style={{ height: '100%' }}>
          {layerList.map(
            (service: UseLayerFromServiceInterface): React.ReactElement => {
              return <LayerComponent key={service.key} {...service} />;
            },
          )}
        </Item>
      </Grid>
      <Grid item xs={9}>
        <Item style={{ height: '100%' }}>
          <div style={{ height: '100%' }}>
            <MapView mapId={mapId}>
              <MapViewLayer {...baseLayerWorldMap} />
              {layerList.map(
                (service: UseLayerFromServiceInterface): React.ReactElement => {
                  return (
                    <MapViewLayer
                      key={service.key}
                      id={service.key}
                      {...service.layer}
                    />
                  );
                },
              )}
            </MapView>
          </div>
        </Item>
      </Grid>
    </Grid>
  );
};
LayerListComponentStory.storyName = 'LayerListComponent';

export default {
  title: 'LayerSelector',
};
