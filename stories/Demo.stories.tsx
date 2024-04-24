/* eslint-disable react/jsx-props-no-spreading */
import * as React from 'react';

import { ThemeWrapper } from '@opengeoweb/theme';
import { MapView, MapViewLayer } from '@opengeoweb/webmap-react';
import { LayerType } from '@opengeoweb/webmap';
import { Box } from '@mui/material';
import { DemoWMSViewer } from '../src/components/DemoWMSViewer';
import { baseLayerWorldMap } from '../src/utils/layerDefinitions';

export const DemoDemoWMSViewerStory = (): React.ReactElement => {
  return (
    <ThemeWrapper>
      <Box>
        <DemoWMSViewer />
      </Box>
    </ThemeWrapper>
  );
};

DemoDemoWMSViewerStory.storyName = 'WMSViewer';

export const MapComponentDemo = (): React.ReactElement => {
  return (
    <ThemeWrapper>
      <div style={{ width: '800px', height: '800px' }}>
        <MapView
          mapId="demo"
          shouldAutoFetch={false}
          srs="EPSG:28992"
          bbox={{
            left: -475000,
            bottom: -210000,
            right: 750000,
            top: 1010000,
          }}
        >
          <MapViewLayer {...baseLayerWorldMap} />

          <MapViewLayer
            id="radarlayer"
            service="https://geoservices.knmi.nl/adagucserver?dataset=RADAR&"
            name="Reflectivity"
          />
          {/* <MapViewLayer
            id="yourlayer"
            service="https://<yourhost>/adagucserver?dataset=RAD_NL25_PCP_CM&"
            name="REFLECTIVITY"
          /> */}
          <MapViewLayer
            id="overlay"
            service="https://geoservices.knmi.nl/adagucserver?dataset=baselayers&"
            name="overlay_europe"
            layerType={LayerType.overLayer}
          />
        </MapView>
      </div>
    </ThemeWrapper>
  );
};

MapComponentDemo.storyName = 'Map';

export default {
  title: 'Demo',
};
