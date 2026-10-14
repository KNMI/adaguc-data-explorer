/* eslint-disable @typescript-eslint/no-floating-promises */
import * as React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Button, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { getWMLayerById } from '@opengeoweb/webmap';
import { MapLocation } from '@opengeoweb/webmap-react';
import '../../assets/styles.css';
import { actions, useAppDispatch, useAppSelector } from '../../store/store';
import { selectors } from '../../store/selectors';
import {
  AdagucHistogramBox,
  AdagucLayer,
  ViewerState,
} from '../../store/types';
import { getFeatureInfoUrl } from '../../utils/getFeatureInfoUrl';
import sanitizeHTML from '../../utils/sanitizeHTML';
import { getTimeSeriesUrl } from '../../utils/getTimeSeriesUrl';
import {
  parseTimeSeriesResponse,
  TimeSeriesResult,
} from '../../utils/parseTimeSeriesResponse';
import { SERIES_DIMENSION_NAMES } from '../../utils/seriesDimensions';
import { getHistogramUrl } from '../../utils/getHistogramUrl';
import {
  HistogramResult,
  parseHistogramResponse,
} from '../../utils/parseHistogramResponse';

export interface QueryPanelProps {
  mapId: string;
  // Whether the Query tab itself is the one currently shown - this panel
  // stays mounted (just hidden) while another main tab is active, so it
  // can't rely on unmounting to know it should stop owning the map's
  // histogram box-select interaction.
  isActive: boolean;
}

type SubTab = 'GetFeatureInfo' | 'TimeSeries' | 'Histogram';

type LayerTimeSeriesState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'done'; result: TimeSeriesResult };

type LayerHistogramState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'done'; result: HistogramResult };

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
const buildTimeSeriesChartData = (
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

const formatHistogramTick = (value: number): string =>
  Number.isInteger(value) ? String(value) : value.toFixed(1);

const QueryPanel = ({
  mapId,
  isActive,
}: QueryPanelProps): React.ReactElement => {
  const dispatch = useAppDispatch();
  const theme = useTheme();

  const [subTab, setSubTab] = React.useState<SubTab>('GetFeatureInfo');

  const [getFeatureInfoResults, setGetFeatureInfoResults] = React.useState<
    Record<string, string>
  >({});
  const [timeSeriesResults, setTimeSeriesResults] = React.useState<
    Record<string, LayerTimeSeriesState>
  >({});
  const [histogramResults, setHistogramResults] = React.useState<
    Record<string, LayerHistogramState>
  >({});

  const layers = useAppSelector((state: ViewerState): AdagucLayer[] =>
    selectors.getMapLayers(state, mapId),
  );
  const mapPinLocation = useAppSelector(
    (state: ViewerState): MapLocation =>
      state?.viewer?.maps[mapId]?.mapPinLocation,
  );
  const isBoxSelectActive = useAppSelector(
    (state: ViewerState): boolean =>
      state?.viewer?.maps[mapId]?.isHistogramBoxSelectActive,
  );
  const histogramBox = useAppSelector(
    (state: ViewerState): AdagucHistogramBox | undefined =>
      state?.viewer?.maps[mapId]?.histogramBox,
  );

  const enabledLayers = layers.filter((layer) => layer.enabled);

  // Box-select is a conscious opt-in (the button below), not turned on just
  // by viewing the Histogram subtab - but it must not stay active once the
  // user has navigated away from it, whether by switching subtabs or by
  // switching to an entirely different main tab (this panel stays mounted
  // either way, so neither case unmounts it on its own).
  React.useEffect(() => {
    if (!isActive || subTab !== 'Histogram') {
      dispatch(actions.setHistogramBoxSelectActive({ mapId, active: false }));
    }
  }, [mapId, isActive, subTab, dispatch]);

  // getTimeSeriesUrl always requests the layer's full time range (not its
  // current value) and widens any percentile/member/ensemble dimension to
  // "*" - so neither actually affects the request URL. Without this, the
  // raw `layers` array (a new reference on every dimension change, e.g.
  // every animation tick) made the fetch effect below re-run - and erase
  // and reload every chart - each time the time slider moved, even though
  // nothing it requested had changed.
  const timeSeriesFetchKey = React.useMemo(
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
  // Mirrors the time series one: only the fields that actually affect the
  // histogram request should cause a refetch.
  const histogramFetchKey = React.useMemo(
    () =>
      JSON.stringify(
        enabledLayers.map((layer) => ({
          id: layer.id,
          serviceUrl: layer.serviceUrl,
          style: layer.style,
          dimensions: layer.dimensions,
        })),
      ),
    [enabledLayers],
  );

  // Not gated on which subtab is shown: GetFeatureInfo and TimeSeries share
  // the same map-click pin, so fetching here whenever the pin moves (even
  // from the other subtab) keeps both ready instead of erasing/refetching
  // every time the user switches subtabs back to one of them.
  React.useEffect(() => {
    if (!mapPinLocation) {
      return;
    }
    setGetFeatureInfoResults({});
    layers
      .filter((layer) => layer.enabled)
      .forEach((layer) => {
        const url = getFeatureInfoUrl(layer, mapPinLocation);
        if (!url) {
          return;
        }
        fetch(url)
          .then((r) => r.text())
          .then((t) => {
            setGetFeatureInfoResults((prev) => ({ ...prev, [layer.id]: t }));
          })
          .catch((e) => {
            // eslint-disable-next-line no-console
            console.error(e);
          });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapPinLocation, layers]);

  React.useEffect(() => {
    if (!mapPinLocation) {
      return;
    }
    setTimeSeriesResults({});
    layers
      .filter((layer) => layer.enabled)
      .forEach((layer) => {
        const url = getTimeSeriesUrl(layer, mapPinLocation);
        if (!url) {
          return;
        }
        setTimeSeriesResults((prev) => ({
          ...prev,
          [layer.id]: { status: 'loading' },
        }));
        fetch(url)
          .then((r) => r.json())
          .then((json) => {
            const result = parseTimeSeriesResponse(json);
            setTimeSeriesResults((prev) => ({
              ...prev,
              [layer.id]: result
                ? { status: 'done', result }
                : { status: 'error' },
            }));
          })
          .catch((e) => {
            // eslint-disable-next-line no-console
            console.error(e);
            setTimeSeriesResults((prev) => ({
              ...prev,
              [layer.id]: { status: 'error' },
            }));
          });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapPinLocation, timeSeriesFetchKey]);

  React.useEffect(() => {
    if (!histogramBox) {
      return;
    }
    setHistogramResults({});
    enabledLayers.forEach((layer) => {
      const url = getHistogramUrl(
        layer,
        histogramBox.bbox,
        histogramBox.srs,
        histogramBox.pixelWidth,
        histogramBox.pixelHeight,
      );
      if (!url) {
        return;
      }
      setHistogramResults((prev) => ({
        ...prev,
        [layer.id]: { status: 'loading' },
      }));
      fetch(url)
        .then((r) => r.json())
        .then((json) => {
          const result = parseHistogramResponse(json);
          setHistogramResults((prev) => ({
            ...prev,
            [layer.id]: result
              ? { status: 'done', result }
              : { status: 'error' },
          }));
        })
        .catch((e) => {
          // eslint-disable-next-line no-console
          console.error(e);
          setHistogramResults((prev) => ({
            ...prev,
            [layer.id]: { status: 'error' },
          }));
        });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [histogramBox, histogramFetchKey]);

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

  const renderGetFeatureInfoBody = (layer: AdagucLayer): React.ReactNode => (
    <div
      className="getfeatureinfo_result_contents"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={sanitizeHTML(
        getFeatureInfoResults[layer.id] || '--',
      )}
    />
  );

  const renderTimeSeriesBody = (layer: AdagucLayer): React.ReactNode => {
    const url = mapPinLocation
      ? getTimeSeriesUrl(layer, mapPinLocation)
      : undefined;
    const state = timeSeriesResults[layer.id];

    if (!mapPinLocation) {
      return 'Click on the map to select a point';
    }
    if (!url) {
      return 'No time dimension for this layer';
    }
    if (!state || state.status === 'loading') {
      return 'Loading…';
    }
    if (state.status === 'error') {
      return 'Failed to load timeseries';
    }
    if (state.result.series.every((s) => s.points.length === 0)) {
      return 'No data for this point';
    }

    const { result } = state;
    const chartData = buildTimeSeriesChartData(result);
    const hasMultipleSeries = result.series.length > 1;
    // Tooltip/Legend default to sorting entries by their string name, which
    // orders "10" before "100" before "25". Sort by the same (already
    // numeric-aware) order the series themselves are in.
    const seriesOrderByDataKey = new Map(
      result.series.map((series, index) => [
        getSeriesDataKey(series.seriesName),
        index,
      ]),
    );
    const itemSorter = (item: { dataKey?: unknown }): number =>
      seriesOrderByDataKey.get(String(item.dataKey)) ?? 0;

    return (
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
            <Legend wrapperStyle={{ fontSize: 11 }} itemSorter={itemSorter} />
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
  };

  const renderHistogramBody = (layer: AdagucLayer): React.ReactNode => {
    const url = histogramBox
      ? getHistogramUrl(
          layer,
          histogramBox.bbox,
          histogramBox.srs,
          histogramBox.pixelWidth,
          histogramBox.pixelHeight,
        )
      : undefined;
    const state = histogramResults[layer.id];

    if (!histogramBox) {
      return 'Select an area on the map to see its histogram';
    }
    if (!url) {
      return 'Layer is not ready yet';
    }
    if (!state || state.status === 'loading') {
      return 'Loading…';
    }
    if (state.status === 'error') {
      return 'Failed to load histogram';
    }
    if (state.result.bins.length === 0) {
      return 'No data for this area';
    }

    const { result } = state;
    const chartData = result.bins.map((bin) => ({
      value: bin.value,
      count: bin.count,
    }));

    return (
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData}>
          <CartesianGrid
            stroke={theme.palette.divider}
            strokeDasharray="3 3"
            vertical={false}
          />
          <XAxis
            dataKey="value"
            tickFormatter={formatHistogramTick}
            stroke={theme.palette.text.secondary}
            tick={{ fontSize: 11 }}
            minTickGap={20}
            label={
              result.units
                ? {
                    value: result.units,
                    position: 'insideBottom',
                    offset: -5,
                    fontSize: 11,
                    fill: theme.palette.text.secondary,
                  }
                : undefined
            }
          />
          <YAxis
            stroke={theme.palette.text.secondary}
            tick={{ fontSize: 11 }}
            width={55}
            label={{
              value: 'count',
              angle: -90,
              position: 'insideLeft',
              fontSize: 11,
              fill: theme.palette.text.secondary,
            }}
          />
          <Tooltip
            labelFormatter={(value: number) =>
              `${formatHistogramTick(value)} ${result.units ?? ''}`.trim()
            }
          />
          <Bar
            dataKey="count"
            fill={theme.palette.primary.main}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  const renderCaption = (layer: AdagucLayer): React.ReactNode => {
    if (subTab === 'GetFeatureInfo') {
      const url = mapPinLocation
        ? getFeatureInfoUrl(layer, mapPinLocation)
        : undefined;
      return (
        url && (
          <a target="_blank" rel="noreferrer" href={url}>
            &#x29c9;
          </a>
        )
      );
    }
    if (subTab === 'TimeSeries') {
      const url = mapPinLocation
        ? getTimeSeriesUrl(layer, mapPinLocation)
        : undefined;
      const state = timeSeriesResults[layer.id];
      return (
        <>
          {state?.status === 'done' && state.result.units && (
            <span>({state.result.units})</span>
          )}
          {url && (
            <a target="_blank" rel="noreferrer" href={url}>
              &#x29c9;
            </a>
          )}
        </>
      );
    }
    const url = histogramBox
      ? getHistogramUrl(
          layer,
          histogramBox.bbox,
          histogramBox.srs,
          histogramBox.pixelWidth,
          histogramBox.pixelHeight,
        )
      : undefined;
    const state = histogramResults[layer.id];
    return (
      <>
        {state?.status === 'done' && (
          <span>
            min {formatHistogramTick(state.result.min)}, max{' '}
            {formatHistogramTick(state.result.max)}, avg{' '}
            {formatHistogramTick(state.result.average)}
            {state.result.units ? ` ${state.result.units}` : ''}
          </span>
        )}
        {url && (
          <a target="_blank" rel="noreferrer" href={url}>
            &#x29c9;
          </a>
        )}
      </>
    );
  };

  const renderBody = (layer: AdagucLayer): React.ReactNode => {
    if (subTab === 'GetFeatureInfo') {
      return renderGetFeatureInfoBody(layer);
    }
    if (subTab === 'TimeSeries') {
      return renderTimeSeriesBody(layer);
    }
    return renderHistogramBody(layer);
  };

  const subTabInstructions: Record<SubTab, string> = {
    GetFeatureInfo: 'Click on the map for info at that point.',
    TimeSeries:
      "Click on the map for a time series at that point. Click a dot on the chart to set the layer's time to that value.",
    Histogram: 'Select an area on the map for a histogram of that area.',
  };

  return (
    <div className="query_panel">
      <div className="query_panel_header">
        <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
          <Button
            size="small"
            variant={subTab === 'GetFeatureInfo' ? 'contained' : 'outlined'}
            onClick={() => setSubTab('GetFeatureInfo')}
          >
            GetFeatureInfo
          </Button>
          <Button
            size="small"
            variant={subTab === 'TimeSeries' ? 'contained' : 'outlined'}
            onClick={() => setSubTab('TimeSeries')}
          >
            TimeSeries
          </Button>
          <Button
            size="small"
            variant={subTab === 'Histogram' ? 'contained' : 'outlined'}
            onClick={() => setSubTab('Histogram')}
          >
            Histogram
          </Button>
        </div>
        <Typography variant="body2">{subTabInstructions[subTab]}</Typography>
        {subTab === 'Histogram' && (
          <div style={{ marginTop: 8 }}>
            <Button
              size="small"
              variant={isBoxSelectActive ? 'contained' : 'outlined'}
              onClick={() => {
                dispatch(
                  actions.setHistogramBoxSelectActive({
                    mapId,
                    active: !isBoxSelectActive,
                  }),
                );
              }}
            >
              {isBoxSelectActive
                ? 'Click and drag a box on the map…'
                : 'Select area for histogram'}
            </Button>
          </div>
        )}
      </div>
      {enabledLayers.length === 0 && <div>No layers added</div>}
      {enabledLayers.map((layer) => (
        <div key={layer.id} className="query_panel_item">
          <div className="query_panel_item_header">
            <code>{layer.name}</code>
          </div>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
          >
            {subTab}
            {renderCaption(layer)}
          </Typography>
          <div className="query_panel_item_body">{renderBody(layer)}</div>
        </div>
      ))}
    </div>
  );
};

export default QueryPanel;
