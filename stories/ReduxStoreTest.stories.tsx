import { Provider } from 'react-redux';
import * as React from 'react';

import store from '../src/store/store';
import ReduxLayerSelector from '../src/components/ReduxLayerSelector';

export const ReduxLayerSelectorStory = (): React.ReactElement => {
  return (
    <Provider store={store}>
      <ReduxLayerSelector />
    </Provider>
  );
};

ReduxLayerSelectorStory.storyName = 'ReduxLayerSelectorStory';

export default {
  title: 'ReduxStoreTest',
};
