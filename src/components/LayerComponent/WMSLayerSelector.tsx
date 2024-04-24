/* eslint-disable react/jsx-props-no-spreading */
import * as React from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
} from '@mui/material';
import { LayerProps } from '@opengeoweb/webmap';
import { Layer } from '@opengeoweb/store/src/store/mapStore/types';

interface WMSLayerSelectorProps {
  layer: Layer;
  layers: LayerProps[];
  onSelectLayer: (layer: LayerProps) => void;
}

const WMSLayerSelector = ({
  layer,
  layers,
  onSelectLayer,
}: WMSLayerSelectorProps): React.ReactElement<WMSLayerSelectorProps> => {
  const handleChange = (event: SelectChangeEvent<string>) => {
    const selectedLayerIndex = layers.findIndex(
      (l) => l.name === event.target.value,
    );
    onSelectLayer(layers[selectedLayerIndex]);
  };

  return (
    <Box sx={{ height: '100%', width: '100%' }}>
      <FormControl size="small" sx={{ width: 'inherit' }}>
        <InputLabel size="small">Layer</InputLabel>
        {layer?.name && (
          <Select
            size="small"
            value={layer?.name}
            label="Layer"
            onChange={handleChange}
          >
            {layers.map((l) => (
              <MenuItem key={l.name} value={l.name}>
                {l.title} - {l.name}
              </MenuItem>
            ))}
          </Select>
        )}
      </FormControl>
    </Box>
  );
};

export default WMSLayerSelector;
