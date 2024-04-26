/* eslint-disable react/jsx-props-no-spreading */
import * as React from 'react';
import { ThemeWrapper } from '@opengeoweb/theme';
import { getWMLayerById } from '@opengeoweb/webmap';
import { AppBar, Grid, IconButton, Toolbar, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import selectLayer from '../../utils/selectLayer';
import WMSDimensionSlider from '../WMSComponents/WMSDimensionSlider';
import WMSStyleSelector from '../WMSComponents/WMSStyleSelector';
import WMSLayerSelector from './WMSLayerSelector';
import { UseLayerFromServiceInterface } from '../../utils/useLayerFromService';

export type LayerComponentProps = UseLayerFromServiceInterface;

export const LayerComponent = ({
  serviceUrl,
  layer,
  setLayer,
  availableLayers,
  getDimensionValue,
  setDimensionValue,
  update,
}: LayerComponentProps): React.ReactElement<LayerComponentProps> => {
  return (
    <ThemeWrapper>
      <Grid container direction="column" style={{ background: 'white' }}>
        <AppBar position="static">
          <Toolbar variant="dense">
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              {getWMLayerById(layer?.id)?.title}
            </Typography>
            <IconButton
              size="small"
              edge="end"
              color="inherit"
              aria-label="menu"
              onClick={() => {
                getWMLayerById(layer?.id)?.zoomToLayer();
                getWMLayerById(layer?.id)?.parentMap?.draw();
              }}
            >
              <CloseIcon />
            </IconButton>
            <IconButton
              size="small"
              edge="end"
              color="inherit"
              aria-label="menu"
              onClick={() => {
                const wmLayer = getWMLayerById(layer?.id);
                if (wmLayer) {
                  wmLayer.enabled = !wmLayer.enabled;
                  update();
                }
              }}
            >
              {getWMLayerById(layer?.id)?.enabled ? 'x' : 'o'}
            </IconButton>
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
                selectLayer(selectedLayer, serviceUrl)
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
            {getWMLayerById(layer?.id)?.dimensions.map((layerDimension) => {
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
