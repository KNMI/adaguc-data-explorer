/* eslint-disable @typescript-eslint/no-floating-promises */
import * as React from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useTheme } from '@mui/material/styles';
import { getWMLayerById } from '@opengeoweb/webmap';
import { MapLocation } from '@opengeoweb/webmap-react';
import '../../assets/styles.css';
import { actions, useAppDispatch, useAppSelector } from '../../store/store';
import { selectors } from '../../store/selectors';
import { AdagucLayer, ViewerState } from '../../store/types';
import { getTimeSeriesUrl } from '../../utils/getTimeSeriesUrl';
import {
  parseTimeSeriesResponse,
  TimeSeriesResult,
} from '../../utils/parseTimeSeriesResponse';
import { SERIES_DIMENSION_NAMES } from '../../utils/seriesDimensions';

export interface TimeSeriesPanelProps {
  mapId: string;
}

type LayerTimeSeriesState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'done'; result: TimeSeriesResult };

// Fixed, in-order categorical palette for the series lines, so a given
// position always gets the same color regardless of how many series there
// are (cycling only once there are more series than colors).
const SERIES_COLORS = [
  '#1976d2',
  '#d84315',
  '#2e7d32',
  '#6a1b9a',
  '#00838f',
  '#ef6c00',
  '#5d4037',
  '#616161',
];

const getSeriesDataKey = (seriesName: string): string => seriesName || 'value';

// recharts draws one Line per series, so the chart's shared `data` is a
// single array with one row per time, each series' value under its own key.
const buildChartData = (
  result: TimeSeriesResult,
): Array<Record<string, number | string>> => {
  const rowByTime = new Map<string, Record<string, number | string>>();
  result.series.forEach((series) => {
    const dataKey = getSeriesDataKey(series.seriesName);
    series.points.forEach((point) => {
      const row = rowByTime.get(point.time) ?? { time: point.time };
      row[dataKey] = point.value;
      rowByTime.set(point.time, row);
    });
  });
  return Array.from(rowByTime.values()).sort((a, b) =>
    String(a.time).localeCompare(String(b.time)),
  );
};

const formatTimeTick = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const TimeSeriesPanel = ({
  mapId,
}: TimeSeriesPanelProps): React.ReactElement => {
  const dispatch = useAppDispatch();
  const theme = useTheme();

  const [results, setResults] = React.useState<
    Record<string, LayerTimeSeriesState>
  >({});

  const layers = useAppSelector((state: ViewerState): AdagucLayer[] =>
    selectors.getMapLayers(state, mapId),
  );
  const mapPinLocation = useAppSelector(
    (state: ViewerState): MapLocation =>
      state?.viewer?.maps[mapId]?.mapPinLocation,
  );

  const enabledLayers = layers.filter((layer) => layer.enabled);

  // getTimeSeriesUrl always requests the layer's full time range (not its
  // current value) and widens any percentile/member/ensemble dimension to
  // "*" - so neither actually affects the request URL. Without this, the
  // raw `layers` array (a new reference on every dimension change, e.g.
  // every animation tick) made the fetch effect below re-run - and erase
  // and reload every chart - each time the time slider moved, even though
  // nothing it requested had changed.
  const fetchKey = React.useMemo(
    () =>
      JSON.stringify(
        enabledLayers.map((layer) => ({
          id: layer.id,
          serviceUrl: layer.serviceUrl,
          style: layer.style,
          dimensions: layer.dimensions
            .filter(
              (dimension) =>
                dimension.name !== 'time' &&
                !SERIES_DIMENSION_NAMES.has(dimension.name),
            )
            .map((dimension) => ({
              name: dimension.name,
              currentValue: dimension.currentValue,
            })),
        })),
      ),
    [enabledLayers],
  );

  // Not gated on whether this tab is the one currently shown: it and
  // GetFeatureInfo share the same map-click pin, so fetching here whenever
  // the pin moves (even from the other panel) keeps this ready instead of
  // erasing/refetching every time the user switches tabs back to it.
  React.useEffect(() => {
    if (!mapPinLocation) {
      return;
    }
    setResults({});
    layers
      .filter((layer) => layer.enabled)
      .forEach((layer) => {
        const url = getTimeSeriesUrl(layer, mapPinLocation);
        if (!url) {
          return;
        }
        setResults((prev) => ({
          ...prev,
          [layer.id]: { status: 'loading' },
        }));
        fetch(url)
          .then((r) => r.json())
          .then((json) => {
            const result = parseTimeSeriesResponse(json);
            setResults((prev) => ({
              ...prev,
              [layer.id]: result
                ? { status: 'done', result }
                : { status: 'error' },
            }));
          })
          .catch((e) => {
            // eslint-disable-next-line no-console
            console.error(e);
            setResults((prev) => ({
              ...prev,
              [layer.id]: { status: 'error' },
            }));
          });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapPinLocation, fetchKey]);

  const jumpLayerToTime = (layer: AdagucLayer, time: string): void => {
    const layerIndex = layers.findIndex((l) => l.id === layer.id);
    if (layerIndex === -1) {
      return;
    }
    // Snap to the dimension's own value representation (as getMapDimURL
    // does for dimension overrides elsewhere), so this matches exactly
    // what the time slider would set and the slider picks up the change.
    const timeDimension = getWMLayerById(layer.id)?.getDimension('time');
    const dimensionValue = timeDimension
      ? timeDimension.getClosestValue(time, true)
      : time;
    dispatch(
      actions.changeLayerDimension({
        mapId,
        layerIndex,
        dimensionName: 'time',
        dimensionValue,
      }),
    );
  };

  return (
    <div className="timeseries_panel">
      <div className="timeseries_panel_header">
        TimeSeries: Click on the map to plot the full time range for each layer
        at that point. Click a dot on a chart to set the layer&apos;s time to
        that value.
      </div>
      {enabledLayers.length === 0 && <div>No layers added</div>}
      {enabledLayers.map((layer) => {
        const url = mapPinLocation
          ? getTimeSeriesUrl(layer, mapPinLocation)
          : undefined;
        const state = results[layer.id];

        let body: React.ReactNode;
        if (!mapPinLocation) {
          body = 'Click on the map to select a point';
        } else if (!url) {
          body = 'No time dimension for this layer';
        } else if (!state || state.status === 'loading') {
          body = 'Loading…';
        } else if (state.status === 'error') {
          body = 'Failed to load timeseries';
        } else if (state.result.series.every((s) => s.points.length === 0)) {
          body = 'No data for this point';
        } else {
          const { result } = state;
          const chartData = buildChartData(result);
          const hasMultipleSeries = result.series.length > 1;
          // Tooltip/Legend default to sorting entries by their string name,
          // which orders "10" before "100" before "25". Sort by the same
          // (already numeric-aware) order the series themselves are in.
          const seriesOrderByDataKey = new Map(
            result.series.map((series, index) => [
              getSeriesDataKey(series.seriesName),
              index,
            ]),
          );
          const itemSorter = (item: { dataKey?: unknown }): number =>
            seriesOrderByDataKey.get(String(item.dataKey)) ?? 0;
          body = (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart
                data={chartData}
                style={{ cursor: 'pointer' }}
                onClick={(chartState) => {
                  if (typeof chartState?.activeLabel === 'string') {
                    jumpLayerToTime(layer, chartState.activeLabel);
                  }
                }}
              >
                <CartesianGrid
                  stroke={theme.palette.divider}
                  strokeDasharray="3 3"
                  vertical={false}
                />
                <XAxis
                  dataKey="time"
                  tickFormatter={formatTimeTick}
                  stroke={theme.palette.text.secondary}
                  tick={{ fontSize: 11 }}
                  minTickGap={20}
                />
                <YAxis
                  domain={['auto', 'auto']}
                  stroke={theme.palette.text.secondary}
                  tick={{ fontSize: 11 }}
                  width={55}
                  label={
                    result.units
                      ? {
                          value: result.units,
                          angle: -90,
                          position: 'insideLeft',
                          fontSize: 11,
                          fill: theme.palette.text.secondary,
                        }
                      : undefined
                  }
                />
                <Tooltip
                  labelFormatter={(value: string) => formatTimeTick(value)}
                  formatter={(value: number, name: string) => [
                    `${value} ${result.units ?? ''}`.trim(),
                    name,
                  ]}
                  itemSorter={itemSorter}
                />
                {hasMultipleSeries && (
                  <Legend
                    wrapperStyle={{ fontSize: 11 }}
                    itemSorter={itemSorter}
                  />
                )}
                {result.series.map((series, index) => {
                  const color = SERIES_COLORS[index % SERIES_COLORS.length];
                  const name = hasMultipleSeries
                    ? `${result.seriesDimensionName} ${series.seriesName}`
                    : (result.standardName ?? layer.name);
                  return (
                    <Line
                      key={series.seriesName}
                      type="linear"
                      dataKey={getSeriesDataKey(series.seriesName)}
                      name={name}
                      stroke={color}
                      strokeWidth={2}
                      dot={{ r: 3, fill: color, strokeWidth: 0 }}
                      isAnimationActive={false}
                      connectNulls
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
          );
        }

        return (
          <div key={layer.id} className="timeseries_panel_item">
            <div className="timeseries_panel_item_header">
              <code>{layer.name}</code>
              {state?.status === 'done' && state.result.units && (
                <span className="timeseries_panel_item_units">
                  {' '}
                  ({state.result.units})
                </span>
              )}
              {url && (
                <a target="_blank" rel="noreferrer" href={url}>
                  {' '}
                  - &#x29c9;
                </a>
              )}
            </div>
            <div className="timeseries_panel_item_body">{body}</div>
          </div>
        );
      })}
    </div>
  );
};

export default TimeSeriesPanel;
