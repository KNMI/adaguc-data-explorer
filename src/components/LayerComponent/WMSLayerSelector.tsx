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

interface WMSLayerSelectorProps {
  layerName: string;
  layers: LayerProps[];
  onSelectLayer: (layerName: string) => void;
}

const WMSLayerSelector = ({
  layerName,
  layers,
  onSelectLayer,
}: WMSLayerSelectorProps): React.ReactElement<WMSLayerSelectorProps> => {
  const handleChange = (event: SelectChangeEvent<string>) => {
    const selectedLayerIndex = layers.findIndex(
      (l) => l.name === event.target.value,
    );
    onSelectLayer(layers[selectedLayerIndex].name);
  };

  if (!layers || !layers.length) {
    return null;
  }
  return (
    <Box sx={{ height: '100%', width: '100%' }}>
      <FormControl size="small" sx={{ width: 'inherit' }}>
        <InputLabel size="small">Layer</InputLabel>
        {layerName && (
          <Select
            size="small"
            value={layerName}
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
