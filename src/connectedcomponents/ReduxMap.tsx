/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable @typescript-eslint/no-floating-promises */
import * as React from 'react';
import {
  AppBar,
  Box,
  Button,
  IconButton,
  Toolbar,
  Typography,
} from '@mui/material';
import { Mosaic } from 'react-mosaic-component';
import { ReactSortable } from 'react-sortablejs';
import MenuIcon from '@mui/icons-material/Menu';
import { ThemeWrapper } from '@opengeoweb/theme';
import { actions, useAppDispatch, useAppSelector } from '../store/store';
import { selectors } from '../store/selectors';
import { ViewerState } from '../store/types';
import { thunks } from '../store/thunks';
import { ReduxLayerComponent } from './ReduxLayerComponent';
import { ReduxMapViewComponent } from './ReduxMapViewComponent';
import 'react-mosaic-component/react-mosaic-component.css';
import '../../stories/story.css';

const ReduxMap = (): React.ReactElement => {
  const dispatch = useAppDispatch();
  const mapId = 'map1';

  const [count, setCount] = React.useState(0);
  const update = () => {
    setCount(count + 1);
  };

  const layersInMap = useAppSelector((state: ViewerState): string[] =>
    selectors.getMapLayerIds(state, mapId),
  );

  // Set first layer as default
  React.useEffect(() => {
    dispatch(actions.removeAllLayers({ mapId }));
    dispatch(
      thunks.addLayer({
        mapId,
        serviceUrl:
          'https://geoservices.knmi.nl/adaguc-server?DATASET=RADAR&SERVICE=WMS&',
        name: 'RAD_NL25_PCP_CM',
      }),
    )
      .unwrap()
      .catch((e) => {
        // eslint-disable-next-line no-console
        console.warn(e);
      });
    dispatch(
      thunks.addLayer({
        mapId,
        serviceUrl:
          'https://geoservices.knmi.nl/adaguc-server?DATASET=HARM_N25&SERVICE=WMS&',
        name: 'air_temperature__at_2m',
      }),
    )
      .unwrap()
      .catch((e) => {
        // eslint-disable-next-line no-console
        console.warn(e);
      });

    dispatch(
      thunks.addLayer({
        mapId,
        serviceUrl:
          'https://adaguc-server-msg-cpp-portal.pmc.knmi.cloud/adaguc-server?DATASET=msgrt&SERVICE=WMS&',
        name: 'air_temperature__at_2m',
      }),
    )
      .unwrap()
      .catch((e) => {
        // eslint-disable-next-line no-console
        console.warn(e);
      });
  }, []);

  const setLayerOrderByIds = (layerListIds: string[]) => {
    dispatch(actions.setLayerOrderByIds({ mapId, layerListIds }));
  };
  const appBar = (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="menu"
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }} />
          <Button color="inherit">Add...</Button>
        </Toolbar>
      </AppBar>
    </Box>
  );

  const sortabkeLayerList = (
    <div style={{ overflowY: 'scroll', width: 'inherit', height: '100%' }}>
      <ReactSortable
        setList={(newList) => {
          if (layersInMap.join() === newList.map((it) => it.id).join()) {
            return;
          }
          setLayerOrderByIds(newList.map((it) => it.id));
        }}
        list={layersInMap.map((l) => {
          return { id: l };
        })}
      >
        {layersInMap.map((layerId, k): React.ReactElement => {
          return (
            <ReduxLayerComponent
              key={layerId}
              layerId={layerId}
              mapId={mapId}
              layerIndex={k}
            />
          );
        })}
      </ReactSortable>
    </div>
  );

  const mosaicItems: { [viewId: string]: JSX.Element } = {
    a: <div />,
    b: <div>{sortabkeLayerList}</div>,
    c: (
      <div>
        <ReduxMapViewComponent mapId={mapId} update={update} />
      </div>
    ),
    d: <div>Right Window</div>,
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
        <div style={{ height: '60px' }}>{appBar}</div>
        <div style={{ flex: 1 }}>
          <Mosaic<string>
            renderTile={(id) => mosaicItems[id]}
            initialValue={{
              direction: 'column',
              first: 'a',
              second: {
                direction: 'row',
                first: 'b',
                second: {
                  direction: 'row',
                  first: 'c',
                  second: 'd',
                  splitPercentage: 99,
                },
                splitPercentage: 30,
              },
              splitPercentage: 0,
            }}
          />
        </div>
      </div>
    </ThemeWrapper>
  );
};

export default ReduxMap;
