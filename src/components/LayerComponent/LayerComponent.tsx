/* eslint-disable react/jsx-props-no-spreading */
import * as React from 'react';
import { ThemeWrapper } from '@opengeoweb/theme';
import { Style, LayerProps, getWMLayerById } from '@opengeoweb/webmap';
import { AppBar, Grid, IconButton, Toolbar, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

import WMSDimensionSlider from '../WMSComponents/WMSDimensionSlider';
import WMSStyleSelector from '../WMSComponents/WMSStyleSelector';
import WMSLayerSelector from './WMSLayerSelector';
import { AdagucLayer } from '../../store/types';

export interface LayerComponentProps {
  serviceUrl: string;
  layer: AdagucLayer;
  availableLayers: LayerProps[];
  selectedStyleName: string;
  styles: Style[];
  onSelectLayer: (layerName: string) => void;
  onSelectStyle: (style: string) => void;
  getDimensionValue: (dimensionName: string) => string;
  setDimensionValue: (dimensionName: string, dimensionValue: string) => void;
  removeLayer: () => void;
  update: () => void;
}
export const LayerComponent = ({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  serviceUrl,
  layer,
  onSelectLayer,
  onSelectStyle,
  availableLayers,
  selectedStyleName,
  styles,
  getDimensionValue,
  setDimensionValue,
  removeLayer,
  update,
}: LayerComponentProps): React.ReactElement<LayerComponentProps> => {
  return (
    <ThemeWrapper>
      <Grid container direction="column" style={{ background: 'white' }}>
        <AppBar position="static">
          <Toolbar variant="dense">
            <Typography
              variant="subtitle2"
              component="div"
              sx={{ flexGrow: 1 }}
            >
              Layer {getWMLayerById(layer?.id)?.name}
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
              onClick={() => {
                removeLayer();
              }}
            >
              <CloseIcon />
            </IconButton>
          </Toolbar>
        </AppBar>
        <Grid container direction="column">
          <Grid item sx={{ p: 1 }} style={{ width: 'inherit' }}>
            <WMSLayerSelector
              layerName={layer?.name}
              layers={availableLayers}
              onSelectLayer={onSelectLayer}
            />
          </Grid>

          <Grid item sx={{ p: 1 }} style={{ width: 'inherit' }}>
            <WMSStyleSelector
              styleName={selectedStyleName}
              styles={styles}
              onSelectStyle={(styleName) => {
                onSelectStyle(styleName);
              }}
            />
          </Grid>
          <Grid item sx={{ p: 1 }} style={{ width: 'inherit' }}>
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
