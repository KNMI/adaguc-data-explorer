/* eslint-disable @typescript-eslint/no-floating-promises */
import * as React from 'react';
import { ThemeWrapper } from '@opengeoweb/theme';

import { actions, useAppDispatch } from '../store/store';
import { ReduxMapViewComponent } from './ReduxMapViewComponent';
import 'react-mosaic-component/react-mosaic-component.css';
import '../assets/styles.css';
import { SortableLayerList } from './SortableLayerList';
import AdagucAppBar from './AdagucAppBar';
import { handleWindowLocationQueryString } from './handleWindowLocationQueryString';
import { AdagucMosaic } from './AdagucMosaic';
import SideToolPanel from './SideTools/SideToolPanel';
import LayerDetailsComponent from './LayerDetailsComponent/LayerDetailsComponent';

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
        <SideToolPanel
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
