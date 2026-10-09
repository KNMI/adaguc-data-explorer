import * as React from 'react';
import {
  getLegendGraphicURLForLayer,
  getWMLayerById,
  legendImageStore,
} from '@opengeoweb/webmap';
import { clearImageCacheForAllMaps } from '@opengeoweb/webmap-react';
import { IconButton, Tooltip } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useAppSelector } from '../../store/store';
import { selectors } from '../../store/selectors';
import { AdagucLayer, ViewerState } from '../../store/types';
import { refreshLayerSource } from '../../utils/refreshLayerSource';

export interface LegendPanelProps {
  mapId: string;
}

const LegendPanel = ({ mapId }: LegendPanelProps): React.ReactElement => {
  const layers = useAppSelector((state: ViewerState): AdagucLayer[] =>
    selectors.getMapLayers(state, mapId),
  );

  const [refreshToken, setRefreshToken] = React.useState(0);

  const enabledLayers = layers.filter((layer) => layer.enabled);

  const handleRefresh = (): void => {
    legendImageStore.clear();
    clearImageCacheForAllMaps();
    enabledLayers.forEach((layer) => {
      const wmLayer = getWMLayerById(layer.id);
      if (wmLayer) {
        refreshLayerSource(wmLayer);
      }
    });
    setRefreshToken((token) => token + 1);
  };

  return (
    <div className="legend_panel">
      <div className="legend_panel_toolbar">
        <Tooltip title="Refresh the image store and legend images">
          <IconButton size="small" onClick={handleRefresh}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </div>
      {enabledLayers.length === 0 && <div>No layers added</div>}
      {enabledLayers.map((layer) => {
        const wmLayer = getWMLayerById(layer.id);
        const legendUrl = wmLayer ? getLegendGraphicURLForLayer(wmLayer) : '';
        const cacheBustedUrl =
          legendUrl && refreshToken > 0
            ? `${legendUrl}${legendUrl.includes('?') ? '&' : '?'}_refresh=${refreshToken}`
            : legendUrl;
        return (
          <div key={layer.id} className="legend_panel_item">
            <div className="legend_panel_item_header">
              <code>{layer.name}</code>
            </div>
            {cacheBustedUrl && (
              <div className="legend_panel_item_image_container">
                <img
                  alt={`Legend for ${layer.name}`}
                  src={cacheBustedUrl}
                  className="legend_panel_item_image"
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default LegendPanel;
