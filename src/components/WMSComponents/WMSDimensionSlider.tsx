/* eslint-disable no-console */
/* eslint-disable react/jsx-props-no-spreading */
import * as React from 'react';
import { Box, Slider, Typography } from '@mui/material';
import { getWMLayerById } from '@opengeoweb/webmap';

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
    <Box sx={{ height: '100%', margin: '0 20px' }}>
      <Typography>
        Dimension {layerDim?.name} in {layerDim?.units} - ({dimIndex}-
        {layerDim.size()})
      </Typography>
      <Slider
        value={dimIndex}
        onChange={handleChange}
        size="small"
        min={0}
        max={layerDim.size()}
        orientation="horizontal"
      />
      <Typography>{selectedDimValue}</Typography>
    </Box>
  );
};

export default WMSDimensionSlider;
