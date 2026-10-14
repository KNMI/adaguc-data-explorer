/* eslint-disable @typescript-eslint/no-floating-promises */
import * as React from 'react';
import { Button, IconButton, Tooltip } from '@mui/material';
import { ArrowForwardIos, ArrowBackIos } from '@mui/icons-material';
import { actions, useAppDispatch, useAppSelector } from '../../store/store';
import { ViewerState } from '../../store/types';
import AutoWMS from './AutoWMS';
import { thunks } from '../../store/thunks';
import QueryPanel from './QueryPanel';
import LegendPanel from './LegendPanel';
import BaseLayersPanel from './BaseLayersPanel';

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

  // GetFeatureInfo and TimeSeries, both subtabs of Query, act on a
  // map-click pin, so this is the single place deciding whether that pin
  // mode is on - owning it here (rather than having QueryPanel toggle it
  // itself) keeps it tied to the main tab regardless of which subtab is
  // showing.
  const isPinModeActive = tabPage === 'Query';
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
              variant={tabPage === 'Query' ? 'contained' : 'outlined'}
              onClick={() => {
                setTabPage('Query');
              }}
            >
              Query
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
            <Button
              size="small"
              variant={tabPage === 'Baselayers' ? 'contained' : 'outlined'}
              onClick={() => {
                setTabPage('Baselayers');
              }}
            >
              Baselayers
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
          className="query_panel_container"
          style={{
            display: tabPage === 'Query' ? 'block' : 'none',
          }}
        >
          <QueryPanel mapId={mapId} isActive={tabPage === 'Query'} />
        </div>
        <div
          className="legend_panel_container"
          style={{
            display: tabPage === 'Legend' ? 'block' : 'none',
          }}
        >
          <LegendPanel mapId={mapId} />
        </div>
        <div
          className="baselayers_panel_container"
          style={{
            display: tabPage === 'Baselayers' ? 'block' : 'none',
          }}
        >
          <BaseLayersPanel />
        </div>
      </div>
    </div>
  );
};

export default SideToolPanel;
