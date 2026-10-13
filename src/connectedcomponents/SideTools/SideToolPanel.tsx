/* eslint-disable @typescript-eslint/no-floating-promises */
import * as React from 'react';
import { Button, IconButton, Tooltip } from '@mui/material';
import { ArrowForwardIos, ArrowBackIos } from '@mui/icons-material';
import { actions, useAppDispatch, useAppSelector } from '../../store/store';
import { ViewerState } from '../../store/types';
import AutoWMS from './AutoWMS';
import { thunks } from '../../store/thunks';
import GetFeatureInfoPanel from './GetFeatureInfoPanel';
import LegendPanel from './LegendPanel';
import TimeSeriesPanel from './TimeSeriesPanel';

export interface ToolPanelInterface {
  toggleExpandToolsPanel: (boolean) => void;
  toolsPanelIsExpanded: boolean;
}
const SideToolPanel = ({
  toggleExpandToolsPanel,
  toolsPanelIsExpanded,
}: ToolPanelInterface): React.ReactElement => {
  const dispatch = useAppDispatch();
  const mapId = 'map1';
  const [tabPage, setTabPageState] = React.useState('AUTOWMS');

  const setTabPage = (value: string): void => {
    setTabPageState(value);
  };

  // GetFeatureInfo and TimeSeries both act on a map-click pin, so this is
  // the single place deciding whether that pin mode is on - owning it here
  // (rather than having each of those panels toggle it from its own
  // `active` prop) avoids a race where both panels' effects fire in the
  // same render and whichever is declared last in the JSX below wins.
  const isPinModeActive =
    tabPage === 'GetFeatureInfo' || tabPage === 'TimeSeries';
  React.useEffect(() => {
    dispatch(
      actions.setGetFeatureInfoActive({ mapId, active: isPinModeActive }),
    );
  }, [mapId, isPinModeActive, dispatch]);

  const autoWMSServiceCommand = useAppSelector(
    (state: ViewerState) => state?.viewer?.autoWMSServiceCommand,
  );
  // The top bar's "custom WMS service" field can send a service here (see
  // AdagucAppBar) instead of adding a layer, when it looks like an AutoWMS
  // explorer url - switch to this tab so the result is actually visible.
  const lastAppliedAutoWMSRequestId = React.useRef<number>(0);
  React.useEffect(() => {
    if (
      !autoWMSServiceCommand ||
      autoWMSServiceCommand.requestId === lastAppliedAutoWMSRequestId.current
    ) {
      return;
    }
    lastAppliedAutoWMSRequestId.current = autoWMSServiceCommand.requestId;
    setTabPage('AUTOWMS');
  }, [autoWMSServiceCommand]);

  return (
    <div style={{ display: 'flex', height: '100%', flexDirection: 'column' }}>
      <div
        style={{
          display: 'block',
          width: '100%',
          height: '40px',
          marginBottom: '0px',
          background: '#BAD0EF',
        }}
      >
        <Tooltip
          title={
            toolsPanelIsExpanded ? 'Collapse tool panel' : 'Expand tool panel'
          }
        >
          <IconButton
            size="small"
            edge="end"
            color="inherit"
            aria-label="menu"
            onClick={() => {
              toggleExpandToolsPanel(!toolsPanelIsExpanded);
            }}
          >
            {toolsPanelIsExpanded ? <ArrowForwardIos /> : <ArrowBackIos />}
          </IconButton>
        </Tooltip>
        {toolsPanelIsExpanded && (
          <>
            <Button
              size="small"
              variant={tabPage === 'AUTOWMS' ? 'contained' : 'outlined'}
              onClick={() => {
                setTabPage('AUTOWMS');
              }}
            >
              AutoWMS
            </Button>
            <Button
              size="small"
              variant={tabPage === 'TimeSeries' ? 'contained' : 'outlined'}
              onClick={() => {
                setTabPage('TimeSeries');
              }}
            >
              TimeSeries
            </Button>
            <Button
              size="small"
              variant={tabPage === 'GetFeatureInfo' ? 'contained' : 'outlined'}
              onClick={() => {
                setTabPage('GetFeatureInfo');
              }}
            >
              GetFeatureInfo
            </Button>
            <Button
              size="small"
              variant={tabPage === 'Legend' ? 'contained' : 'outlined'}
              onClick={() => {
                setTabPage('Legend');
              }}
            >
              Legend
            </Button>
          </>
        )}
      </div>
      <div
        style={{
          display: toolsPanelIsExpanded ? 'contents' : 'none',
          height: 'inherit',
          width: '100%',
        }}
      >
        <div style={{ display: tabPage === 'AUTOWMS' ? 'contents' : 'none' }}>
          <AutoWMS
            externalServiceRequest={autoWMSServiceCommand}
            addLayer={(service: string, name: string): void => {
              dispatch(
                thunks.addLayer({
                  serviceUrl: service,
                  name,
                  mapId,
                }),
              );
            }}
          />
        </div>
        <div
          className="timeseries_panel_container"
          style={{
            display: tabPage === 'TimeSeries' ? 'block' : 'none',
          }}
        >
          <TimeSeriesPanel mapId={mapId} />
        </div>
        <div
          className="getfeatureinfo_panel"
          style={{
            display: tabPage === 'GetFeatureInfo' ? 'block' : 'none',
          }}
        >
          <GetFeatureInfoPanel mapId={mapId} />
        </div>
        <div
          className="legend_panel_container"
          style={{
            display: tabPage === 'Legend' ? 'block' : 'none',
          }}
        >
          <LegendPanel mapId={mapId} />
        </div>
      </div>
    </div>
  );
};

export default SideToolPanel;
