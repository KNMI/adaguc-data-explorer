/* eslint-disable no-console */
/* eslint-disable react/jsx-props-no-spreading */
import * as React from 'react';
import { Box, Slider } from '@mui/material';
import { getWMLayerById } from '@opengeoweb/webmap';

interface WMSTimeSliderProps {
  selectedISOTime: string;
  layerId: string;
  onSelectTime: (time: string) => void;
}

const WMSTimeSlider = ({
  selectedISOTime,
  layerId,
  onSelectTime,
}: WMSTimeSliderProps): React.ReactElement<WMSTimeSliderProps> => {
  // Checks
  if (!selectedISOTime) {
    return null;
  }
  const wmLayer = getWMLayerById(layerId);
  if (!wmLayer) {
    console.warn(`No layer exists for ${layerId}`);
    return null;
  }
  const timeDim = wmLayer.getDimension('time');
  if (!timeDim) {
    console.warn(`No time exists for ${layerId}`);
    return null;
  }
  const handleChange = (event: Event, value: number) => {
    let timeIndex = value;
    if (timeIndex < 0) timeIndex = 0;
    if (timeIndex > timeDim.size() - 1) timeIndex = timeDim.size() - 1;
    onSelectTime(timeDim.getValueForIndex(timeIndex) as string);
  };

  const timeIndex = timeDim.getIndexForValue(selectedISOTime);

  const timeToDisplay = selectedISOTime.substring(0, 10);
  return (
    <Box sx={{ height: '100%', margin: '0 20px' }}>
      <Slider
        value={timeIndex}
        onChange={handleChange}
        size="small"
        min={0}
        max={timeDim.size()}
        orientation="horizontal"
        valueLabelDisplay="on"
        valueLabelFormat={() => {
          return timeToDisplay;
        }}
      />
    </Box>
  );
};

export default WMSTimeSlider;
