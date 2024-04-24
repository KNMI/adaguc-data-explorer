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
import { getWMLayerById } from '@opengeoweb/webmap';
import { Layer } from '@opengeoweb/store/src/store/mapStore/types';

interface WMSStyleSelectorProps {
  layer: Layer;
  onSelectStyle: (layer: Layer) => void;
}

const WMSStyleSelector = ({
  layer,
  onSelectStyle,
}: WMSStyleSelectorProps): React.ReactElement<WMSStyleSelectorProps> => {
  const handleChange = (event: SelectChangeEvent<string>) => {
    const newLayer: Layer = { ...layer };
    newLayer.style = event.target.value;
    const wmLayer = getWMLayerById(layer.id);
    wmLayer.setStyle(newLayer.style);
    wmLayer.parentMap.draw();
    onSelectStyle(newLayer);
  };
  if (!layer || !layer.id) return null;
  const wmLayer = getWMLayerById(layer.id);
  if (!wmLayer) return null;
  const styles = wmLayer.getStyles();
  if (!styles) return null;
  const currentStyle = wmLayer.getStyle();

  return (
    <Box sx={{ height: '100%' }}>
      <FormControl size="small">
        <InputLabel size="small">Style</InputLabel>
        <Select
          size="small"
          value={currentStyle}
          label="Style"
          onChange={handleChange}
        >
          {styles.map((l, i) => (
            // eslint-disable-next-line react/no-array-index-key
            <MenuItem key={`${l.name}i${i}`} value={l.name}>
              {l.title}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
};

export default WMSStyleSelector;
