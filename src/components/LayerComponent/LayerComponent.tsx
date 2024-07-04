/* eslint-disable react/jsx-props-no-spreading */
import * as React from 'react';

import {
  Style,
  getLegendGraphicURLForLayer,
  getWMLayerById,
} from '@opengeoweb/webmap';
import {
  Card,
  CardContent,
  CardHeader,
  Grid,
  IconButton,
  Slider,
  Tooltip,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PlayIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import SettingsIcon from '@mui/icons-material/Settings';
import DetailsIcon from '@mui/icons-material/Info';
import DuplicateIcon from '@mui/icons-material/FileCopy';

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
  isAnimating: boolean;
  onSelectLayer: (layerName: string) => void;
  onSelectStyle: (style: string) => void;
  onChangeLayerEnabled: (enabled: boolean) => void;
  onChangeOpacity: (opacity: number) => void;
  onDuplicate: () => void;
  getDimensionValue: (dimensionName: string) => string;
  setDimensionValue: (dimensionName: string, dimensionValue: string) => void;
  removeLayer: () => void;
  layerToggleAnimation: () => void;
  update: () => void;
}
export const LayerComponent = ({
  serviceUrl,
  layer,
  onSelectLayer,
  onSelectStyle,
  onChangeLayerEnabled,
  onChangeOpacity,
  onDuplicate,
  selectedStyleName,
  styles,
  isAnimating,
  getDimensionValue,
  setDimensionValue,
  removeLayer,
  layerToggleAnimation,
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
    <Tooltip title="Remove this layer">
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
    </Tooltip>
  );

  return (
    <Card
      style={{
        padding: '0px',
        margin: 0,
        marginBottom: '10px',
        background: '#E8E8EF',
      }}
    >
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
        style={{ padding: '5px 5px 20px 5px', background: '#BAD0EF' }}
      />
      <CardContent style={{ padding: '0px', margin: '0px' }}>
        <Grid
          container
          direction="row"
          style={{ padding: '2px', margin: 0, marginTop: '5px' }}
        >
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
            <Grid
              item
              sx={{ paddingBottom: 1 }}
              style={{ width: 'inherit', background: 'white' }}
            >
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

              overflow: 'hidden',
            }}
          >
            <img alt="legend" width="100%" src={legendGraphicUrl} />
          </Grid>
        </Grid>
        <Grid style={{ background: '#BAD0EF', height: '34px' }}>
          <Grid style={{ float: 'right' }}>
            <Tooltip title="Change opacity of this layer">
              <Slider
                value={(wmLayer?.opacity || 1) * 100}
                style={{
                  position: 'absolute',
                  width: '70px',
                  left: 0,
                  margin: '2px',
                }}
                onChange={(e, value: number) => {
                  if (wmLayer) {
                    wmLayer.opacity = value / 100;
                    onChangeOpacity(wmLayer.opacity);
                    update();
                  }
                }}
                size="small"
                min={0}
                max={100}
                orientation="horizontal"
              />
            </Tooltip>
            <Tooltip title="Duplicate">
              <IconButton
                size="small"
                edge="end"
                color="inherit"
                aria-label="menu"
                onClick={() => {
                  onDuplicate();
                }}
              >
                <DuplicateIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Layer details">
              <IconButton
                size="small"
                edge="end"
                color="inherit"
                aria-label="menu"
                onClick={() => {
                  alert('tbi');
                }}
              >
                <DetailsIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Layer settings">
              <IconButton
                size="small"
                edge="end"
                color="inherit"
                aria-label="menu"
                onClick={() => {
                  alert('tbi');
                }}
              >
                <SettingsIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Enable/disable layer">
              <IconButton
                size="small"
                edge="end"
                color="inherit"
                aria-label="menu"
                onClick={() => {
                  // const wmLayer = getWMLayerById(layer?.id);
                  if (wmLayer) {
                    wmLayer.enabled = !wmLayer.enabled;
                    onChangeLayerEnabled(wmLayer.enabled);
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
            </Tooltip>
            <Tooltip title="Play animation based on this layer">
              <IconButton
                size="small"
                edge="end"
                color="inherit"
                aria-label="menu"
                onClick={() => {
                  layerToggleAnimation();
                }}
              >
                {isAnimating ? <StopIcon /> : <PlayIcon />}
              </IconButton>
            </Tooltip>
            <Tooltip title="Zoom to extent of this layer">
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
            </Tooltip>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};
