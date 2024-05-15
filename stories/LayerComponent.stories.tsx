/* eslint-disable react/jsx-props-no-spreading */
import * as React from 'react';
import { ThemeWrapper } from '@opengeoweb/theme';
import { Box, Grid } from '@mui/material';
import { webmapUtils } from '@opengeoweb/webmap';
import { MapView, MapViewLayer } from '@opengeoweb/webmap-react';
import { Mosaic } from 'react-mosaic-component';
import 'react-mosaic-component/react-mosaic-component.css';
import { ReactSortable } from 'react-sortablejs';
import './story.css';
import LayerSelector from '../src/components/LayerComponent/WMSLayerSelector';
import selectLayer from '../src/utils/selectLayer';

import useLayerFromService, {
  UseLayerFromServiceInterface,
} from '../src/utils/useLayerFromService';
import { LayerComponent } from '../src/components/LayerComponent/LayerComponent';
import { baseLayerWorldMap } from '../src/utils/layerDefinitions';

export const LayerSelectorStory = (): React.ReactElement => {
  const wmsService =
    'https://adaguc-server-ecad-adaguc.pmc.knmi.cloud/adaguc-server?DATASET=eobs_v27.0e&SERVICE=WMS';

  const { layer, availableLayers, setLayer } = useLayerFromService(wmsService);
  return (
    <ThemeWrapper>
      <Grid container direction="column" style={{ background: 'white' }}>
        <LayerSelector
          layer={layer}
          layers={availableLayers}
          onSelectLayer={(selectedLayer) => {
            selectLayer(selectedLayer, wmsService)
              .then(setLayer)
              .catch((e) => {
                window.console.error(e);
              });
          }}
        />
      </Grid>
    </ThemeWrapper>
  );
};

LayerSelectorStory.storyName = 'LayerSelector';

export const LayerComponentStory = (): React.ReactElement => {
  const serviceUrl =
    'https://geoservices.knmi.nl/adaguc-server?DATASET=HARM_N25&SERVICE=WMS&';

  const {
    layer,
    availableLayers,
    setLayer,
    getDimensionValue,
    setDimensionValue,
  } = useLayerFromService(serviceUrl);

  return (
    <LayerComponent
      serviceUrl={serviceUrl}
      layer={layer}
      availableLayers={availableLayers}
      setLayer={setLayer}
      getDimensionValue={getDimensionValue}
      setDimensionValue={setDimensionValue}
      update={() => {}}
      key=""
    />
  );
};
LayerComponentStory.storyName = 'LayerComponent';

export const LayerListComponentStory = (): React.ReactElement => {
  const [count, setUpdate] = React.useState(0);

  const update = () => {
    setUpdate((count + 1) % 10);
  };

  const a = useLayerFromService(
    'https://geoservices.knmi.nl/adaguc-server?DATASET=RADAR&SERVICE=WMS&',
  );
  const b = useLayerFromService(
    'https://geoservices.knmi.nl/adaguc-server?DATASET=HARM_N25&SERVICE=WMS&',
  );
  const h = [a, b];

  // const layerList = React.useRef<UseLayerFromServiceInterface[]>(h).current;
  // console.log(layerList);
  const layerList = h;
  const mapId = React.useRef<string>(webmapUtils.generateMapId()).current;

  const sortabkeLayerList = (
    <ReactSortable
      setList={(newList) => {
        // setLayerList(newList);
      }}
      onSort={({ oldIndex, newIndex }) => {
        console.log(oldIndex, newIndex);
        const la = layerList[oldIndex];
        const lb = layerList[newIndex];

        layerList[oldIndex] = lb;
        layerList[newIndex] = la;
        update();
        // const wmjsMap = getMapById(mapId);
        // wmjsMap.m
      }}
      list={layerList.map((layer) => {
        return layer.key;
      })}
    >
      {layerList.map(
        (service: UseLayerFromServiceInterface): React.ReactElement => {
          return <LayerComponent key={service.key} {...service} />;
        },
      )}
    </ReactSortable>
  );
  const mapViewComponent = (
    <MapView mapId={mapId}>
      <MapViewLayer {...baseLayerWorldMap} />
      {layerList.map(
        (service: UseLayerFromServiceInterface): React.ReactElement => {
          return (
            <MapViewLayer
              key={service.key}
              id={service.key}
              {...service.layer}
            />
          );
        },
      )}
    </MapView>
  );

  const mosaicItems: { [viewId: string]: JSX.Element } = {
    a: (
      <div>
        <Box sx={{ width: 'inherit', height: 'inherit', overflowY: 'scroll' }}>
          {sortabkeLayerList}
        </Box>
      </div>
    ),
    b: <div>{mapViewComponent}</div>,
    c: <div>Bottom Right Window</div>,
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
          splitPercentage: 30,
        }}
      />
    </div>
  );
};
LayerListComponentStory.storyName = 'LayerListComponent';

export default {
  title: 'LayerSelector',
};
