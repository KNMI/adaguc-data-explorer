import * as React from 'react';
import { Checkbox, Typography } from '@mui/material';
import { LayerType } from '@opengeoweb/webmap';
import { actions, useAppDispatch, useAppSelector } from '../../store/store';
import { AdagucBaseLayer, ViewerState } from '../../store/types';

// Ported from adaguc-viewer's "Select basemaps and overlays" tab: a plain
// multi-select list over a fixed, predefined set of base maps/overlays (see
// baseLayerPresets.ts) - checking several base layers at once is allowed,
// same as there, since it's up to the user which one ends up visibly on
// top (see the zIndex ordering in ReduxMapViewComponent).
const BaseLayersPanel = (): React.ReactElement => {
  const dispatch = useAppDispatch();
  const baseLayers = useAppSelector(
    (state: ViewerState): AdagucBaseLayer[] => state?.viewer?.baseLayers,
  );

  const toggleBaseLayer = (id: string, enabled: boolean): void => {
    dispatch(actions.setBaseLayerEnabled({ id, enabled }));
  };

  const baseMaps = baseLayers.filter(
    (layer) => layer.layerType === LayerType.baseLayer,
  );
  const overlays = baseLayers.filter(
    (layer) => layer.layerType === LayerType.overLayer,
  );

  const renderItem = (layer: AdagucBaseLayer): React.ReactElement => (
    <div
      key={layer.id}
      className="baselayers_panel_item"
      style={{ display: 'flex', alignItems: 'center' }}
    >
      <Checkbox
        checked={layer.enabled}
        size="small"
        onChange={(event) => toggleBaseLayer(layer.id, event.target.checked)}
        inputProps={{ 'aria-label': layer.title }}
      />
      <div>
        <Typography variant="body2">{layer.title}</Typography>
        <Typography variant="caption" color="text.secondary">
          <code>{layer.name}</code>
        </Typography>
      </div>
    </div>
  );

  return (
    <div className="baselayers_panel">
      <div className="baselayers_panel_header">
        <Typography variant="body2">
          Select the base maps and overlays shown on the map.
        </Typography>
      </div>
      <Typography
        variant="caption"
        color="text.secondary"
        className="baselayers_panel_group_header"
      >
        Base maps
      </Typography>
      {baseMaps.map(renderItem)}
      <Typography
        variant="caption"
        color="text.secondary"
        className="baselayers_panel_group_header"
      >
        Overlays
      </Typography>
      {overlays.map(renderItem)}
    </div>
  );
};

export default BaseLayersPanel;
