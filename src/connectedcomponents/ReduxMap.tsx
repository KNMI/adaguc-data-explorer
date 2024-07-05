/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable @typescript-eslint/no-floating-promises */
import * as React from 'react';
import { ThemeWrapper } from '@opengeoweb/theme';
import { Button, IconButton, Tooltip } from '@mui/material';
import { ArrowForwardSharp, ArrowBackSharp } from '@mui/icons-material';
import { getWMJSMapById } from '@opengeoweb/webmap';
import { MapLocation } from '@opengeoweb/webmap-react';
import { actions, useAppDispatch } from '../store/store';
import { ReduxMapViewComponent } from './ReduxMapViewComponent';
import 'react-mosaic-component/react-mosaic-component.css';
import '../assets/styles.css';
import { SortableLayerList } from './SortableLayerList';
import AdagucAppBar from './AdagucAppBar';
import { handleWindowLocationQueryString } from './handleWindowLocationQueryString';
import { AdagucMosaic } from './AdagucMosaic';
import AutoWMS from './AutoWMS';
import { thunks } from '../store/thunks';
import sanitizeHTML from '../utils/sanitizeHTML';

interface ToolPanelInterface {
  toggleExpandToolsPanel: (boolean) => void;
  toolsPanelIsExpanded: boolean;
}
const ToolPanel = ({
  toggleExpandToolsPanel,
  toolsPanelIsExpanded,
}: ToolPanelInterface): React.ReactElement => {
  const dispatch = useAppDispatch();
  const mapId = 'map1';
  const [tabPage, setTabPageState] = React.useState('AUTOWMS');

  const results = React.useRef(new Map<string, string>()).current;

  const [, setCount] = React.useState(0);

  React.useEffect(() => {
    const handleOnSetMapPinEffect = (mapPinLatLonCoordinate: MapLocation) => {
      if (tabPage === 'GetFeatureInfo') {
        getWMJSMapById(mapId)?.getMapPin().showMapPin();
        getWMJSMapById(mapId)?.getMapPin().positionMapPinByLatLon({
          x: mapPinLatLonCoordinate.lon,
          y: mapPinLatLonCoordinate.lat,
        });
        getWMJSMapById(mapId)?.draw();
        const mouse = getWMJSMapById(mapId)?.getMapPin().getXY();

        getWMJSMapById(mapId)
          ?.getLayers()
          .forEach((layer) => {
            const url = getWMJSMapById(mapId)?.getWMSGetFeatureInfoRequestURL(
              layer,
              mouse.x,
              mouse.y,
              'text/html',
            );
            fetch(url)
              .then((r) => {
                r.text().then((t) => {
                  results.set(layer.id, t);
                  setCount(Math.random());
                });
              })
              .catch((e) => {
                // eslint-disable-next-line no-console
                console.error(e);
              });
          });
      }
    };

    getWMJSMapById(mapId)?.addListener(
      'onsetmappin',
      handleOnSetMapPinEffect,
      true,
    );
    return () => {
      getWMJSMapById(mapId)?.removeListener(
        'onsetmappin',
        handleOnSetMapPinEffect,
      );

      getWMJSMapById(mapId)?.getMapPin().hideMapPin();
    };
  }, [tabPage]);

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
            {toolsPanelIsExpanded ? <ArrowForwardSharp /> : <ArrowBackSharp />}
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
          GetFeatureInfo: Click on the map
          <div>
            {getWMJSMapById(mapId)
              ?.getLayers()
              .map((layer) => {
                return (
                  <div key={layer.id} className="getfeatureinfo_result">
                    {layer.id}
                    <div
                      // eslint-disable-next-line react/no-danger
                      dangerouslySetInnerHTML={sanitizeHTML(
                        results.get(layer.id) || '--',
                      )}
                    />
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
};

const ReduxMap = (): React.ReactElement => {
  const dispatch = useAppDispatch();
  const mapId = 'map1';

  const [count, setCount] = React.useState(0);
  const update = () => {
    setCount(count + 1);
  };

  const [toolsPanelIsExpanded, toggleExpandToolsPanel] = React.useState(true);

  // Set first layer as default
  React.useEffect(() => {
    dispatch(actions.removeAllLayers({ mapId }));
    handleWindowLocationQueryString(mapId, dispatch);
  }, []);

  const mosaicItems: { [viewId: string]: JSX.Element } = {
    a: <div />,
    b: (
      <div>
        <SortableLayerList mapId={mapId} />
      </div>
    ),
    c: (
      <div>
        <ReduxMapViewComponent mapId={mapId} update={update} />
      </div>
    ),
    d: (
      <div>
        <ToolPanel
          toolsPanelIsExpanded={toolsPanelIsExpanded}
          toggleExpandToolsPanel={toggleExpandToolsPanel}
        />
      </div>
    ),
  };

  return (
    <ThemeWrapper>
      <div
        style={{
          width: '100vw',
          height: '100vh',
          display: 'flex',
          flexFlow: 'column wrap',
          margin: 0,
          padding: 0,
          overflow: 'hidden',
        }}
      >
        <div style={{ height: '60px' }}>
          <AdagucAppBar />
        </div>
        <div style={{ flex: 1 }}>
          <AdagucMosaic
            mosaicItems={mosaicItems}
            collapseAutoWMS={toolsPanelIsExpanded}
          />
        </div>
      </div>
    </ThemeWrapper>
  );
};

export default ReduxMap;
