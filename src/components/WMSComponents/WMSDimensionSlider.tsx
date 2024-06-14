/* eslint-disable no-console */
/* eslint-disable react/jsx-props-no-spreading */
import * as React from 'react';
import { Box, Button, IconButton, Slider, Typography } from '@mui/material';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import { getWMLayerById } from '@opengeoweb/webmap';
import Checkbox from '@mui/material/Checkbox';

interface WMSDimensionSliderProps {
  selectedDimensionValue: string;
  layerId: string;
  onSelectDimensionValue: (dimensionValue: string) => void;
  dimensionName: string;
}

const WMSDimensionSlider = ({
  selectedDimensionValue: selectedDimValue,
  layerId,
  onSelectDimensionValue: onSelectDimValue,
  dimensionName = 'time',
}: WMSDimensionSliderProps): React.ReactElement<WMSDimensionSliderProps> => {
  const wmLayer = getWMLayerById(layerId);
  if (!wmLayer) {
    console.warn(`No layer exists for ${layerId}`);
    return null;
  }
  const layerDim = wmLayer.getDimension(dimensionName);
  if (!layerDim) {
    console.warn(`No dimension exists for ${layerId}`);
    return null;
  }
  const handleChange = (event: Event, value: number) => {
    let dimIndex = value;
    if (dimIndex < 0) dimIndex = 0;
    if (dimIndex > layerDim.size() - 1) dimIndex = layerDim.size() - 1;
    onSelectDimValue(layerDim.getValueForIndex(dimIndex) as string);
  };

  const dimIndex = layerDim.getIndexForValue(selectedDimValue);

  return (
    <Box sx={{ height: '100%', margin: '0' }}>
      <Typography>
        Dimension {layerDim?.name} in {layerDim?.units} - ({dimIndex}-
        {layerDim.size()})
      </Typography>
      <div style={{ display: 'flex' }}>
        <Checkbox
          defaultChecked={layerDim.linked}
          onChange={(e, checked) => {
            layerDim.linked = checked;
          }}
        />
        <Slider
          value={dimIndex}
          onChange={handleChange}
          size="small"
          min={0}
          max={layerDim.size()}
          orientation="horizontal"
        />
        <IconButton
          style={{ marginLeft: '20px' }}
          size="small"
          edge="end"
          color="inherit"
          onClick={() => {
            handleChange(null, dimIndex - 1);
          }}
        >
          <ArrowBackIosIcon fontSize="small" />
        </IconButton>
        <IconButton
          size="small"
          edge="end"
          color="inherit"
          onClick={() => {
            handleChange(null, dimIndex + 1);
          }}
        >
          <ArrowForwardIosIcon fontSize="small" />
        </IconButton>
      </div>
      <Typography>{selectedDimValue}</Typography>
    </Box>
  );
};

export default WMSDimensionSlider;
