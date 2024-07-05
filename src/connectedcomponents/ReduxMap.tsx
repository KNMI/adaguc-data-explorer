/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable @typescript-eslint/no-floating-promises */
import * as React from 'react';
import { ThemeWrapper } from '@opengeoweb/theme';
import { Button } from '@mui/material';
import { actions, useAppDispatch } from '../store/store';
import { ReduxMapViewComponent } from './ReduxMapViewComponent';
import 'react-mosaic-component/react-mosaic-component.css';
import '../../stories/story.css';
import { SortableLayerList } from './SortableLayerList';
import AdagucAppBar from './AdagucAppBar';
import { handleWindowLocationQueryString } from './handleWindowLocationQueryString';
import { AdagucMosaic } from './AdagucMosaic';
import AutoWMS from './AutoWMS';
import { thunks } from '../store/thunks';

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
          <AdagucMosaic mosaicItems={mosaicItems} />
        </div>
      </div>
    </ThemeWrapper>
  );
};

export default ReduxMap;
