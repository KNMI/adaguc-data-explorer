/* eslint-disable no-console */
/* eslint-disable react/jsx-props-no-spreading */
import * as React from 'react';
import {
  Box,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  Stack,
} from '@mui/material';
import {
  CustomDate,
  getWMLayerById,
  parseISO8601DateToDate,
  parseISO8601IntervalToDateInterval,
} from '@opengeoweb/webmap';

import ArrowLeft from '@mui/icons-material/ArrowLeft';
import ArrowRight from '@mui/icons-material/ArrowRight';

export enum TimeMode {
  YEAR,
  MONTH,
  DAY,
  HOUR,
  MINUTE,
  SECOND,
}

interface WMSDimTimeYearSelectorProps {
  selectedISOTime: string;
  layerId: string;
  onSelectTime: (time: string) => void;
  mode: TimeMode;
}

const getDaysInMonth = (month: number, year: number): number => {
  return new Date(year, month, 0).getDate();
};

export const increaseTime = (
  selectedISOTime: string,
  timeRes: string,
): string => {
  const duration = parseISO8601IntervalToDateInterval(timeRes);
  const currentTime = parseISO8601DateToDate(selectedISOTime);
  currentTime.add(duration);
  const newIsoTime = currentTime.toISO8601();
  return newIsoTime;
};

const getISOTimeDurationStringFromMode = (timeMode: TimeMode) => {
  switch (timeMode) {
    case TimeMode.YEAR:
      return { increment: 'P1Y', decrement: 'P-1Y' };
      break;
    case TimeMode.MONTH:
      return { increment: 'P1M', decrement: 'P-1M' };
      break;
    case TimeMode.DAY:
      return { increment: 'P1D', decrement: 'P-1D' };
      break;
    case TimeMode.HOUR:
      return { increment: 'PT1H', decrement: 'PT-1H' };
      break;
    case TimeMode.MINUTE:
      return { increment: 'PT1M', decrement: 'PT-1M' };
      break;
    case TimeMode.SECOND:
      return { increment: 'PT1S', decrement: 'PT-1S' };
      break;
    default:
      break;
  }
  return { increment: '', decrement: '' };
};

const getTimeItemByTimeMode = (
  customDate: CustomDate,
  timeMode: TimeMode,
): number => {
  switch (timeMode) {
    case TimeMode.YEAR:
      return customDate.getUTCFullYear();
      break;
    case TimeMode.MONTH:
      return customDate.getUTCMonth();
      break;
    case TimeMode.DAY:
      return customDate.getUTCDate();
      break;
    case TimeMode.HOUR:
      return customDate.getUTCHours();
      break;
    case TimeMode.MINUTE:
      return customDate.getUTCMinutes();
      break;
    case TimeMode.SECOND:
      return customDate.getUTCSeconds();
      break;
    default:
      break;
  }
  return 0;
};

const setTimeItemByTimeMode = (
  customDate: CustomDate,
  timeItem: number,
  timeMode: TimeMode,
): number => {
  switch (timeMode) {
    case TimeMode.YEAR:
      return customDate.setUTCFullYear(timeItem);
      break;
    case TimeMode.MONTH: {
      const year = customDate.getUTCFullYear();
      const daysInCurrentMonth = customDate.getUTCDate();
      const daysInNewMonth = getDaysInMonth(timeItem + 1, year);
      // If this new month has less days then currently set in the original data, set it to max numer of days in this month possible.
      if (daysInNewMonth < daysInCurrentMonth) {
        customDate.setUTCDate(daysInNewMonth);
      }
      return customDate.setUTCMonth(timeItem);
      break;
    }
    case TimeMode.DAY:
      return customDate.setUTCDate(timeItem);
      break;
    case TimeMode.HOUR:
      return customDate.setUTCHours(timeItem);
      break;
    case TimeMode.MINUTE:
      return customDate.setUTCMinutes(timeItem);
      break;
    case TimeMode.SECOND:
      return customDate.setUTCSeconds(timeItem);
      break;
    default:
      break;
  }
  return 0;
};

const getNameByTimeMode = (timeMode: TimeMode): string => {
  switch (timeMode) {
    case TimeMode.YEAR:
      return 'Year';
      break;
    case TimeMode.MONTH:
      return 'Month';
      break;
    case TimeMode.DAY:
      return 'Day';
      break;
    case TimeMode.HOUR:
      return 'Hour';
      break;
    case TimeMode.MINUTE:
      return 'Minute';
      break;
    case TimeMode.SECOND:
      return 'Second';
      break;
    default:
      break;
  }
  return '';
};

const WMSDimTimeYearSelector = ({
  selectedISOTime,
  layerId,
  onSelectTime,
  mode = TimeMode.YEAR,
}: WMSDimTimeYearSelectorProps): React.ReactElement<WMSDimTimeYearSelectorProps> => {
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
  const selectAndValidateTime = (isoTime: string): void => {
    const timeIndex = timeDim.getIndexForValue(isoTime);
    if (timeIndex >= 0 && timeIndex < timeDim.size()) {
      onSelectTime(timeDim.getValueForIndex(timeIndex) as string);
    }
  };
  const handleChange = (event: SelectChangeEvent<string>) => {
    const currentTime = parseISO8601DateToDate(selectedISOTime);
    setTimeItemByTimeMode(currentTime, +event.target.value, mode);
    selectAndValidateTime(currentTime.toISO8601());
  };

  const selectedTimeItem = getTimeItemByTimeMode(
    parseISO8601DateToDate(selectedISOTime),
    mode,
  );

  const startItem = getTimeItemByTimeMode(
    parseISO8601DateToDate(timeDim.get(0)),
    mode,
  );
  const endItem = getTimeItemByTimeMode(
    parseISO8601DateToDate(timeDim.get(timeDim.size() - 1)),
    mode,
  );

  const itemList = [];
  if (mode === TimeMode.YEAR) {
    for (let item = startItem; item <= endItem; item += 1) {
      itemList.push({
        name: `${item}`,
        title: `${item}`,
      });
    }
  }
  if (mode === TimeMode.MONTH) {
    for (let item = 0; item < 12; item += 1) {
      itemList.push({
        name: `${item}`,
        title: `0${item + 1}`.slice(-2),
      });
    }
  }
  if (mode === TimeMode.DAY) {
    const month =
      getTimeItemByTimeMode(
        parseISO8601DateToDate(selectedISOTime),
        TimeMode.MONTH,
      ) + 1;
    const year = getTimeItemByTimeMode(
      parseISO8601DateToDate(selectedISOTime),
      TimeMode.YEAR,
    );

    const daysInMonth = getDaysInMonth(month, year);

    for (let item = 1; item <= daysInMonth; item += 1) {
      itemList.push({
        name: `${item}`,
        title: `0${item}`.slice(-2),
      });
    }
  }
  itemList.reverse();
  return (
    <Box sx={{ height: '100%' }}>
      <FormControl size="small">
        <InputLabel size="small">{getNameByTimeMode(mode)}</InputLabel>
        <Stack direction="row" spacing={1}>
          <Select
            size="small"
            value={`${selectedTimeItem}`}
            label={getNameByTimeMode(mode)}
            onChange={handleChange}
            style={{ margin: 0, padding: 0, fontFamily: 'Courier' }}
          >
            {itemList.map((l) => (
              <MenuItem key={l.name} value={l.name}>
                {l.title}
              </MenuItem>
            ))}
          </Select>
          <IconButton
            size="small"
            style={{ margin: 0, padding: 0 }}
            onClick={() => {
              selectAndValidateTime(
                increaseTime(
                  selectedISOTime,
                  getISOTimeDurationStringFromMode(mode).decrement,
                ),
              );
            }}
          >
            <ArrowLeft fontSize="inherit" />
          </IconButton>
          <IconButton
            size="small"
            style={{ margin: 0, padding: 0 }}
            onClick={() => {
              selectAndValidateTime(
                increaseTime(
                  selectedISOTime,
                  getISOTimeDurationStringFromMode(mode).increment,
                ),
              );
            }}
          >
            <ArrowRight fontSize="inherit" />
          </IconButton>
        </Stack>
      </FormControl>
    </Box>
  );
};

export default WMSDimTimeYearSelector;
