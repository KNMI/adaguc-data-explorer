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
import { Style } from '@opengeoweb/webmap';

interface WMSStyleSelectorProps {
  styleName: string;
  styles: Style[];
  onSelectStyle: (styleName: string) => void;
}

const WMSStyleSelector = ({
  styleName,
  styles,
  onSelectStyle,
}: WMSStyleSelectorProps): React.ReactElement<WMSStyleSelectorProps> => {
  const handleChange = (event: SelectChangeEvent<string>) => {
    // const newLayer: Layer = { ...layer };
    // newLayer.style = event.target.value;
    // const wmLayer = getWMLayerById(layer.id);
    // wmLayer.setStyle(newLayer.style);
    // wmLayer.parentMap?.draw();
    onSelectStyle(event.target.value);
  };

  const styleList = [...(styles && styles.length ? styles : [])];
  styleList.push({
    name: 'default',
    title: 'default',
    legendURL: '',
    abstract: '',
  });
  const selectedStyleName = styleName || styleList[0].name;
  return (
    <Box sx={{ height: '100%', width: '100%' }}>
      <FormControl size="small" sx={{ width: 'inherit' }}>
        <InputLabel size="small">Style</InputLabel>
        <Select
          size="small"
          value={selectedStyleName}
          label="Style"
          onChange={handleChange}
        >
          {styleList.map((l, i) => (
            // eslint-disable-next-line react/no-array-index-key
            <MenuItem key={`${l.name}i${i}`} value={l.name}>
              {l.title} - {l.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
};

export default WMSStyleSelector;
