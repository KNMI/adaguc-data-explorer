/* eslint-disable react/jsx-props-no-spreading */
import * as React from 'react';
import 'react-mosaic-component/react-mosaic-component.css';
import '../assets/styles.css';
import { LayerComponent } from '../src/components/LayerComponent/LayerComponent';
import useLayerFromService from '../src/utils/useLayerFromService';

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
      layer={{ ...layer, serviceUrl }}
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

export default {
  title: 'LayerSelector',
};
