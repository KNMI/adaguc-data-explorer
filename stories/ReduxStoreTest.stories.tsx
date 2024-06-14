import { Provider } from 'react-redux';
import * as React from 'react';

import store from '../src/store/store';
import ReduxLayerSelector from '../src/connectedcomponents/ReduxLayerSelector';
import ReduxMap from '../src/connectedcomponents/ReduxMap';

export const ReduxLayerSelectorStory = (): React.ReactElement => {
  return (
    <Provider store={store}>
      <ReduxLayerSelector />
    </Provider>
  );
};

export const ReduxMapStory = (): React.ReactElement => {
  return (
    <Provider store={store}>
      <ReduxMap />
    </Provider>
  );
};

ReduxLayerSelectorStory.storyName = 'ReduxLayerSelectorStory';

export default {
  title: 'ReduxStoreTest',
};
