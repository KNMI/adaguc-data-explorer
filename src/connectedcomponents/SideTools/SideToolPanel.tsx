/* eslint-disable @typescript-eslint/no-floating-promises */
import * as React from 'react';
import { Button, IconButton, Tooltip } from '@mui/material';
import { ArrowForwardIos, ArrowBackIos } from '@mui/icons-material';
import { useAppDispatch } from '../../store/store';
import AutoWMS from './AutoWMS';
import { thunks } from '../../store/thunks';
import GetFeatureInfoPanel from './GetFeatureInfoPanel';

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
          style={{ display: tabPage === 'TimeSeries' ? 'contents' : 'none' }}
        >
          Timeseries TBD
        </div>
        <div
          className="getfeatureinfo_panel"
          style={{
            display: tabPage === 'GetFeatureInfo' ? 'block' : 'none',
          }}
        >
          <GetFeatureInfoPanel
            mapId={mapId}
            active={tabPage === 'GetFeatureInfo'}
          />
        </div>
      </div>
    </div>
  );
};

export default SideToolPanel;
