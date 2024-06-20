/* eslint-disable react/jsx-props-no-spreading */
import * as React from 'react';

import {
  Style,
  getLegendGraphicURLForLayer,
  getWMLayerById,
} from '@opengeoweb/webmap';
import { Card, CardContent, CardHeader, Grid, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import CenterFocusStrongIcon from '@mui/icons-material/CenterFocusStrong';
import { debounce } from 'lodash';
import WMSDimensionSlider from '../WMSComponents/WMSDimensionSlider';
import WMSStyleSelector from '../WMSComponents/WMSStyleSelector';
import WMSLayerSelector from './WMSLayerSelector';
import { AdagucLayer } from '../../store/types';

export interface LayerComponentProps {
  serviceUrl: string;
  layerIndex: number;
  layer: AdagucLayer;
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
  serviceUrl,
  layer,
  onSelectLayer,
  onSelectStyle,
  selectedStyleName,
  styles,
  getDimensionValue,
  setDimensionValue,
  removeLayer,
  update: updateParent,
  layerIndex,
}: LayerComponentProps): React.ReactElement<LayerComponentProps> => {
  const [count, setUpdate] = React.useState(0);

  const update = () => {
    updateParent();
    setUpdate((count + 1) % 10);
  };
  const wmLayer = getWMLayerById(layer?.id);
  const cardTitle = `${wmLayer?.title}`;
  const cardSubTitle = `Name: ${layer?.name}`;

  const [legendGraphicUrl, setLegendGraphic] = React.useState<string>('');

  const debouncedHandleChange = React.useRef(
    debounce((dwmLayer) => {
      const undebouncedLegendGraphic = getLegendGraphicURLForLayer(dwmLayer);
      setLegendGraphic(undebouncedLegendGraphic);
    }, 500),
  ).current;

  debouncedHandleChange(wmLayer);

  const cardActions = (
    <>
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
        <CenterFocusStrongIcon />
      </IconButton>
      <IconButton
        size="small"
        edge="end"
        color="inherit"
        aria-label="menu"
        onClick={() => {
          // const wmLayer = getWMLayerById(layer?.id);
          if (wmLayer) {
            wmLayer.enabled = !wmLayer.enabled;
            update();
          }
        }}
      >
        {getWMLayerById(layer?.id)?.enabled ? (
          <VisibilityIcon />
        ) : (
          <VisibilityOffIcon />
        )}
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
    </>
  );

  return (
    <Card style={{ padding: '0px', marginTop: '0px', marginBottom: '5px' }}>
      <CardHeader
        title={cardTitle}
        subheader={cardSubTitle}
        action={cardActions}
        titleTypographyProps={{
          fontSize: '16px',
          overflow: 'hidden',
          width: '100%',
          display: 'block',
          height: '20px',
          maxWidth: '280px',
          noWrap: true,
        }}
        subheaderTypographyProps={{
          fontSize: '14px',
          overflow: 'hidden',
          display: 'block',
          position: 'absolute',
          width: '100%',
          noWrap: true,
        }}
        style={{ borderBottom: '2px solid #888', height: '70px' }}
      />
      <CardContent>
        <Grid container direction="row">
          <Grid item xs={10}>
            <Grid item sx={{ paddingBottom: 1 }} style={{ width: 'inherit' }}>
              <WMSLayerSelector
                layerName={layer?.name}
                serviceUrl={serviceUrl}
                onSelectLayer={(layerName) => {
                  onSelectLayer(layerName);
                  update();
                }}
              />
            </Grid>

            <Grid item sx={{ paddingBottom: 1 }} style={{ width: 'inherit' }}>
              <WMSStyleSelector
                styleName={selectedStyleName}
                styles={styles}
                onSelectStyle={(styleName) => {
                  onSelectStyle(styleName);
                }}
              />
            </Grid>
            <Grid item sx={{ paddingBottom: 1 }} style={{ width: 'inherit' }}>
              {getWMLayerById(layer?.id)?.dimensions.map((layerDimension) => {
                return (
                  <WMSDimensionSlider
                    key={`${layer.name}${layerDimension.name}${layerIndex}`}
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

          <Grid
            item
            xs={2}
            style={{
              height: 'inherit',
              maxHeight: '180px',
              overflow: 'hidden',
            }}
          >
            <img alt="legend" width="100%" src={legendGraphicUrl} />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};
