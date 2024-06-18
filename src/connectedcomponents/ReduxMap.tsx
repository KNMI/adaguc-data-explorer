/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable @typescript-eslint/no-floating-promises */
import * as React from 'react';
import { Mosaic } from 'react-mosaic-component';
import { ThemeWrapper } from '@opengeoweb/theme';
import { actions, useAppDispatch } from '../store/store';
import { thunks } from '../store/thunks';
import { ReduxMapViewComponent } from './ReduxMapViewComponent';
import 'react-mosaic-component/react-mosaic-component.css';
import '../../stories/story.css';
import { SortableLayerList } from './SortableLayerList';
import { AdagucAppBar } from './AdagucAppBar';

const ReduxMap = (): React.ReactElement => {
  const dispatch = useAppDispatch();
  const mapId = 'map1';

  const [count, setCount] = React.useState(0);
  const update = () => {
    setCount(count + 1);
  };

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
    // dispatch(
    //   thunks.addLayer({
    //     mapId,
    //     serviceUrl:
    //       'https://geoservices.knmi.nl/adaguc-server?DATASET=HARM_N25&SERVICE=WMS&',
    //     name: 'air_temperature__at_2m',
    //   }),
    // )
    //   .unwrap()
    //   .catch((e) => {
    //     // eslint-disable-next-line no-console
    //     console.warn(e);
    //   });

    // dispatch(
    //   thunks.addLayer({
    //     mapId,
    //     serviceUrl:
    //       'https://adaguc-server-msg-cpp-portal.pmc.knmi.cloud/adaguc-server?DATASET=msgrt&SERVICE=WMS&',
    //     name: 'air_temperature__at_2m',
    //   }),
    // )
    //   .unwrap()
    //   .catch((e) => {
    //     // eslint-disable-next-line no-console
    //     console.warn(e);
    //   });
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
        <div style={{ height: '60px' }}>
          <AdagucAppBar />
        </div>
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
