/* eslint-disable react/jsx-props-no-spreading */
import * as React from 'react';
import { ThemeWrapper } from '@opengeoweb/theme';
import { Grid } from '@mui/material';
import LayerSelector from '../src/components/LayerComponent/WMSLayerSelector';
import selectLayer from '../src/utils/selectLayer';
import useLayerFromService from '../src/utils/useLayerFromService';
import { LayerComponent } from '../src/components/LayerComponent/LayerComponent';

export const DemoDemoWMSViewerStory = (): React.ReactElement => {
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

DemoDemoWMSViewerStory.storyName = 'LayerSelector';

export const LayerComponentStory = (): React.ReactElement => {
  const wmsService =
    'https://geoservices.knmi.nl/adaguc-server?DATASET=HARM_N25&SERVICE=WMS&';
  return <LayerComponent wmsService={wmsService} />;
};
LayerComponentStory.storyName = 'LayerComponent';

export default {
  title: 'LayerSelector',
};
