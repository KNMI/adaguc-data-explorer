/* eslint-disable react/jsx-props-no-spreading */
import * as React from 'react';

import { Style, getWMLayerById } from '@opengeoweb/webmap';
import { openLayersGetMapImageStore } from '@opengeoweb/webmap-react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  IconButton,
  Slider,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PlayIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import SettingsIcon from '@mui/icons-material/Settings';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import RefreshIcon from '@mui/icons-material/Refresh';
// import DetailsIcon from '@mui/icons-material/Info';
import DuplicateIcon from '@mui/icons-material/FileCopy';

import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import CenterFocusStrongIcon from '@mui/icons-material/CenterFocusStrong';
import WMSDimensionSlider from '../WMSComponents/WMSDimensionSlider';
import WMSStyleSelector from '../WMSComponents/WMSStyleSelector';
import WMSLayerSelector from './WMSLayerSelector';
import { AdagucLayer } from '../../store/types';
import { CopyToClipBoard } from '../../connectedcomponents/CopyToClipBoard';
import { getDatasetNameFromServiceUrl } from '../../utils/getDatasetNameFromServiceUrl';
import { makeGoodServiceLink } from '../../utils/makeGoodServiceLink';

const makeGetCapabilitiesUrl = (serviceUrl: string): string =>
  `${makeGoodServiceLink(serviceUrl)}SERVICE=WMS&REQUEST=GetCapabilities`;

export interface LayerComponentProps {
  serviceUrl: string;
  layerIndex: number;
  layer: AdagucLayer;
  selectedStyleName: string;
  styles: Style[];
  isAnimating: boolean;
  onSelectLayer: (layerName: string) => void;
  openLayerDetails: (layerId: string) => void;
  onSelectStyle: (style: string) => void;
  onChangeLayerEnabled: (enabled: boolean) => void;
  onChangeOpacity: (opacity: number) => void;
  onDuplicate: () => void;
  getDimensionValue: (dimensionName: string) => string;
  setDimensionValue: (dimensionName: string, dimensionValue: string) => void;
  getDimensionLinked: (dimensionName: string) => boolean;
  setDimensionLinked: (dimensionName: string, linked: boolean) => void;
  removeLayer: () => void;
  layerToggleAnimation: () => void;
  zoomToLayer: () => void;
  update: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onRefreshLayer: () => Promise<void>;
}
export const LayerComponent = ({
  serviceUrl,
  layer,
  onSelectLayer,
  openLayerDetails,
  onSelectStyle,
  onChangeLayerEnabled,
  onChangeOpacity,
  onDuplicate,
  selectedStyleName,
  styles,
  isAnimating,
  getDimensionValue,
  setDimensionValue,
  getDimensionLinked,
  setDimensionLinked,
  removeLayer,
  layerToggleAnimation,
  zoomToLayer,
  update: updateParent,
  layerIndex,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
  onRefreshLayer,
}: LayerComponentProps): React.ReactElement<LayerComponentProps> => {
  const [count, setUpdate] = React.useState(0);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  // How long this layer's last GetMap image request took, in ms - set by
  // TimeawareImageSource whenever a map pan/zoom/update triggers a new
  // request, outside of anything this component itself calls, so there's
  // no event to hook into here - poll the already-tracked value instead.
  const [lastGetMapDurationMs, setLastGetMapDurationMs] = React.useState<
    number | undefined
  >(undefined);
  React.useEffect(() => {
    const interval = setInterval(() => {
      setLastGetMapDurationMs(
        openLayersGetMapImageStore.loadDuration.getLoadDurationForId(layer.id),
      );
    }, 500);
    return () => {
      clearInterval(interval);
    };
  }, [layer.id]);

  const update = () => {
    updateParent();
    setUpdate((count + 1) % 10);
  };

  const handleRefreshLayer = (): void => {
    setIsRefreshing(true);
    onRefreshLayer()
      .then(() => {
        update();
      })
      .finally(() => {
        setIsRefreshing(false);
      })
      .catch(() => {
        // eslint-disable-next-line no-console
        console.warn('Failed to refresh layer capabilities');
      });
  };
  const wmLayer = getWMLayerById(layer?.id);
  const cardTitle = `Layer ${wmLayer?.title}`;
  const datasetName = getDatasetNameFromServiceUrl(serviceUrl);
  const getCapabilitiesUrl = makeGetCapabilitiesUrl(serviceUrl);
  const cardSubTitle = (
    <>
      {datasetName && (
        <Box
          sx={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            color: 'text.secondary',
          }}
        >
          Dataset: <code>{datasetName}</code>
        </Box>
      )}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        <CopyToClipBoard info="GetCapabilities url" text={getCapabilitiesUrl} />
        <code>{getCapabilitiesUrl}</code>
      </Box>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        <code>{layer?.name}</code>
      </Box>
    </>
  );

  const cardActions = (
    <Stack direction="row" spacing={0.25} sx={{ alignItems: 'center' }}>
      {layer?.hasError && (
        <Tooltip title="Layer has an error">
          <WarningAmberIcon color="warning" fontSize="small" />
        </Tooltip>
      )}
      <Tooltip title="Remove this layer">
        <IconButton
          size="small"
          aria-label="Remove layer"
          onClick={() => {
            removeLayer();
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Stack>
  );

  // Both the header and the footer share this tint, so the card reads as
  // one unit with the (scrollable, variable-height) content sandwiched in
  // between - the header's default `-8px` action margin assumes the
  // Card's own roomier default padding, which this layout doesn't use, so
  // it's reset below to keep the close button from sitting outside the
  // header's visible bounds.
  const barSx = {
    bgcolor: (theme: import('@mui/material/styles').Theme) =>
      alpha(theme.palette.primary.main, 0.12),
  };

  return (
    <Card
      className="layercomponent_item"
      elevation={0}
      sx={{
        borderRadius: 2,
        overflow: 'hidden',
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.08)',
      }}
    >
      <CardHeader
        title={cardTitle}
        subheader={cardSubTitle}
        action={cardActions}
        slotProps={{
          title: {
            fontSize: '0.95rem',
            fontWeight: 600,
            noWrap: true,
          },
          subheader: {
            fontSize: '0.8rem',
            component: 'div',
          },
        }}
        sx={{
          ...barSx,
          py: 1,
          px: 1.5,
          '& .MuiCardHeader-content': { minWidth: 0 },
          '& .MuiCardHeader-action': { margin: 0, alignSelf: 'center' },
        }}
      />
      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Stack spacing={1}>
          <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
            <CopyToClipBoard
              info={`layer name (${layer?.name})`}
              text={layer?.name}
            />
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <WMSLayerSelector
                layerName={layer?.name}
                serviceUrl={serviceUrl}
                onSelectLayer={(layerName) => {
                  onSelectLayer(layerName);
                  update();
                }}
              />
            </Box>
          </Stack>
          <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
            <CopyToClipBoard
              info={`style name (${selectedStyleName}) for layer ${layer?.name}`}
              text={selectedStyleName}
            />
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <WMSStyleSelector
                styleName={selectedStyleName}
                styles={styles}
                onSelectStyle={(styleName) => {
                  onSelectStyle(styleName);
                }}
              />
            </Box>
          </Stack>
          {getWMLayerById(layer?.id)?.dimensions.map((layerDimension) => {
            const dimensionValue = getDimensionValue(layerDimension.name);
            return (
              <Stack
                key={`${layer.name}${layerDimension.name}${layerIndex}`}
                direction="row"
                spacing={0.5}
                sx={{ alignItems: 'center' }}
              >
                <CopyToClipBoard
                  info={`${layerDimension.name} value (${dimensionValue}) for layer ${layer?.name}`}
                  text={dimensionValue}
                />
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <WMSDimensionSlider
                    selectedDimensionValue={dimensionValue}
                    layerId={layer?.id}
                    onSelectDimensionValue={(value) => {
                      setDimensionValue(layerDimension.name, value);
                    }}
                    dimensionName={layerDimension.name}
                    linked={getDimensionLinked(layerDimension.name)}
                    onToggleLinked={(linked) => {
                      setDimensionLinked(layerDimension.name, linked);
                    }}
                  />
                </Box>
              </Stack>
            );
          })}
        </Stack>
      </CardContent>
      <Box
        sx={{
          ...barSx,
          display: 'flex',
          alignItems: 'center',
          gap: 0.25,
          px: 1,
          py: 0.5,
          borderTop: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Tooltip title="Move layer up">
          <span>
            <IconButton
              size="small"
              aria-label="Move layer up"
              disabled={!canMoveUp}
              onClick={() => {
                onMoveUp();
              }}
            >
              <ArrowUpwardIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Move layer down">
          <span>
            <IconButton
              size="small"
              aria-label="Move layer down"
              disabled={!canMoveDown}
              onClick={() => {
                onMoveDown();
              }}
            >
              <ArrowDownwardIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Duplicate">
          <IconButton
            size="small"
            aria-label="Duplicate layer"
            onClick={() => {
              onDuplicate();
            }}
          >
            <DuplicateIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Reload WMS capabilities for this layer">
          <span>
            <IconButton
              size="small"
              aria-label="Reload layer capabilities"
              disabled={isRefreshing}
              onClick={handleRefreshLayer}
            >
              <RefreshIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Duration of this layer's last GetMap request">
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ px: 0.5, whiteSpace: 'nowrap' }}
          >
            {lastGetMapDurationMs !== undefined
              ? `${lastGetMapDurationMs} ms`
              : '--- ms'}
          </Typography>
        </Tooltip>
        <Tooltip title="Layer settings">
          <IconButton
            size="small"
            aria-label="Layer settings"
            onClick={() => {
              openLayerDetails(layer.id);
            }}
          >
            <SettingsIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Play animation based on this layer">
          <IconButton
            size="small"
            aria-label={
              isAnimating ? 'Stop layer animation' : 'Play layer animation'
            }
            onClick={() => {
              layerToggleAnimation();
            }}
          >
            {isAnimating ? (
              <StopIcon fontSize="small" />
            ) : (
              <PlayIcon fontSize="small" />
            )}
          </IconButton>
        </Tooltip>
        <Tooltip title="Change opacity of this layer">
          <Slider
            value={(wmLayer?.opacity || 1) * 100}
            sx={{ flexGrow: 1, mx: 1.5 }}
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
        <Tooltip title="Enable/disable layer">
          <IconButton
            size="small"
            aria-label={
              getWMLayerById(layer?.id)?.enabled
                ? 'Disable layer'
                : 'Enable layer'
            }
            onClick={() => {
              if (wmLayer) {
                wmLayer.enabled = !wmLayer.enabled;
                onChangeLayerEnabled(wmLayer.enabled);
                update();
              }
            }}
          >
            {getWMLayerById(layer?.id)?.enabled ? (
              <VisibilityIcon fontSize="small" />
            ) : (
              <VisibilityOffIcon fontSize="small" />
            )}
          </IconButton>
        </Tooltip>
        <Tooltip title="Zoom to extent of this layer">
          <IconButton
            size="small"
            aria-label="Zoom to layer extent"
            onClick={() => {
              zoomToLayer();
            }}
          >
            <CenterFocusStrongIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </Card>
  );
};
