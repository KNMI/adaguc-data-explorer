/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable @typescript-eslint/no-floating-promises */
import * as React from 'react';
import { Box } from '@mui/material';
import { Mosaic } from 'react-mosaic-component';
import { ReactSortable } from 'react-sortablejs';
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
    dispatch(actions.removeAllLayers(mapId));
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
  }, []);

  const setLayerOrderByIds = (layerListIds: string[]) => {
    dispatch(actions.setLayerOrderByIds({ mapId, layerListIds }));
  };

  const sortabkeLayerList = (
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
  );

  const mosaicItems: { [viewId: string]: JSX.Element } = {
    a: <div>{sortabkeLayerList}</div>,
    b: (
      <div>
        <ReduxMapViewComponent mapId={mapId} update={update} />
      </div>
    ),
    c: <div>Right Window</div>,
  };

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        margin: 0,
        padding: 0,
        overflow: 'hidden',
      }}
    >
      <Mosaic<string>
        renderTile={(id) => mosaicItems[id]}
        initialValue={{
          direction: 'row',
          first: 'a',
          second: {
            direction: 'row',
            first: 'b',
            second: 'c',
            splitPercentage: 99,
          },
          splitPercentage: 25,
        }}
      />
    </div>
  );
};

export default ReduxMap;
