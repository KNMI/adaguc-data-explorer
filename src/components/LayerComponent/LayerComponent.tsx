/* eslint-disable react/jsx-props-no-spreading */
import * as React from 'react';
import { ThemeWrapper } from '@opengeoweb/theme';
import { getWMLayerById } from '@opengeoweb/webmap';
import { AppBar, Grid, IconButton, Toolbar, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import selectLayer from '../../utils/selectLayer';
import useLayerFromService from '../../utils/useLayerFromService';
import WMSDimensionSlider from '../WMSComponents/WMSDimensionSlider';
import WMSStyleSelector from '../WMSComponents/WMSStyleSelector';
import WMSLayerSelector from './WMSLayerSelector';

export interface LayerComponentProps {
  wmsService: string;
}

export const LayerComponent = ({
  wmsService,
}: LayerComponentProps): React.ReactElement<LayerComponentProps> => {
  // const wmsService =
  //   'https://geoservices.knmi.nl/adaguc-server?DATASET=HARM_N25&SERVICE=WMS&';

  const {
    layer,
    availableLayers,
    setLayer,
    getDimensionValue,
    setDimensionValue,
  } = useLayerFromService(wmsService);

  const wmLayer = getWMLayerById(layer?.id);
  return (
    <ThemeWrapper>
      <Grid container direction="column" style={{ background: 'white' }}>
        <AppBar position="static">
          <Toolbar variant="dense">
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              {wmLayer?.title}
            </Typography>
            <IconButton
              size="small"
              edge="end"
              color="inherit"
              aria-label="menu"
            >
              <CloseIcon />
            </IconButton>
          </Toolbar>
        </AppBar>
        <Grid container direction="column">
          <Grid item sx={{ p: 2 }}>
            <WMSLayerSelector
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

          <Grid item sx={{ p: 2 }}>
            <WMSStyleSelector
              layer={layer}
              onSelectStyle={(data) => {
                setLayer(data);
              }}
            />
          </Grid>
          <Grid item sx={{ p: 2 }}>
            {wmLayer?.dimensions.map((layerDimension) => {
              return (
                <WMSDimensionSlider
                  key={layerDimension.name}
                  selectedDimensionValue={getDimensionValue(
                    layerDimension.name,
                  )}
                  layerId={layer?.id}
                  onSelectDimensionValue={(value) => {
                    setDimensionValue(layerDimension.name, value);
                  }}
                  dimensionName={layerDimension.name}
                />
              );
            })}
          </Grid>
        </Grid>
      </Grid>
    </ThemeWrapper>
  );
};
