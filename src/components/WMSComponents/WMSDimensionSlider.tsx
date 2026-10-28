/* eslint-disable no-console */
/* eslint-disable react/jsx-props-no-spreading */
import * as React from 'react';
import { Box, IconButton, Slider, Tooltip, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import { getWMLayerById } from '@opengeoweb/webmap';
import Checkbox from '@mui/material/Checkbox';
import { debounce } from 'lodash';

const CustomSlider = styled(Slider)(() => ({
  '& .MuiSlider-thumb': {
    transition: 'none',
  },
  '& .MuiSlider-track': {
    transition: 'none',
  },
}));

interface WMSDimensionSliderProps {
  selectedDimensionValue: string;
  layerId: string;
  onSelectDimensionValue: (dimensionValue: string) => void;
  dimensionName: string;
  // Whether this dimension is "linked": changing it on any other linked
  // layer's matching dimension also updates this one to match.
  linked: boolean;
  onToggleLinked: (linked: boolean) => void;
}

const WMSDimensionSlider = ({
  selectedDimensionValue: selectedDimValue,
  layerId,
  onSelectDimensionValue: onSelectDimValue,
  dimensionName = 'time',
  linked,
  onToggleLinked,
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
  const [stateDimIndex, setStateDimIndex] = React.useState<number>(0);

  React.useEffect(() => {
    setStateDimIndex(layerDim.getIndexForValue(selectedDimValue));
  }, [selectedDimValue]);

  const debouncedHandleChange = React.useRef(
    debounce(
      (dstateDimIndex) => {
        const newValue = layerDim.getValueForIndex(dstateDimIndex) as string;
        onSelectDimValue(newValue);
      },
      50,
      { leading: true, trailing: true, maxWait: 50 },
    ),
  ).current;

  const handleChange = (event: Event, value: number) => {
    let dimIndex = value;
    if (dimIndex < 0) dimIndex = 0;
    if (dimIndex > layerDim.size() - 1) dimIndex = layerDim.size() - 1;
    setStateDimIndex(dimIndex);
    debouncedHandleChange(dimIndex);
    // onSelectDimValue(layerDim.getValueForIndex(dimIndex) as string);
  };

  // const dimIndex = layerDim.getIndexForValue(selectedDimValue);

  return (
    <Box sx={{ height: '100%', margin: '0', padding: 0 }}>
      <Typography sx={{ fontSize: '12px' }}>
        Dimension {layerDim?.name} in {layerDim?.units} - ({stateDimIndex}-
        {layerDim.size()})
      </Typography>
      <div style={{ display: 'flex' }}>
        <Tooltip title="Link to other layers with this checked, so changing one changes them all together">
          <Checkbox
            style={{ padding: 0 }}
            checked={linked}
            onChange={(e, checked) => {
              onToggleLinked(checked);
            }}
            slotProps={{
              input: {
                'aria-label': `Link ${dimensionName} dimension for ${layerId}`,
              },
            }}
          />
        </Tooltip>
        <CustomSlider
          value={stateDimIndex}
          style={{ margin: '10px 0 0 5px', padding: 0 }}
          onChange={handleChange}
          size="small"
          min={0}
          max={layerDim.size()}
          orientation="horizontal"
        />
        <IconButton
          style={{ marginLeft: '10px', fontSize: '12px' }}
          size="small"
          edge="end"
          color="inherit"
          onClick={() => {
            handleChange(null, stateDimIndex - 1);
          }}
        >
          <ArrowBackIosIcon fontSize="inherit" />
        </IconButton>
        <IconButton
          style={{ fontSize: '12px' }}
          size="small"
          edge="end"
          color="inherit"
          onClick={() => {
            handleChange(null, stateDimIndex + 1);
          }}
        >
          <ArrowForwardIosIcon fontSize="inherit" />
        </IconButton>
      </div>
      <Typography sx={{ fontSize: '12px' }}>{selectedDimValue}</Typography>
    </Box>
  );
};

export default WMSDimensionSlider;
