import { Provider } from 'react-redux';
import * as React from 'react';

import store from '../src/store/store';
import ReduxLayerSelector from '../src/connectedcomponents/ReduxLayerSelector';
import ReduxMap from '../src/connectedcomponents/ReduxMap';
import { ThemeWrapper, createTheme } from '@opengeoweb/theme';

export const ReduxLayerSelectorStory = (): React.ReactElement => {
  return (
    <Provider store={store}>
      <ReduxLayerSelector />
    </Provider>
  );
};

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

export const ReduxMapStory = (): React.ReactElement => {
  return (
    <ThemeWrapper theme={darkTheme}>
      <Provider store={store}>
        <ReduxMap />
      </Provider>
    </ThemeWrapper>
  );
};

ReduxLayerSelectorStory.storyName = 'ReduxLayerSelectorStory';

export default {
  title: 'ReduxStoreTest',
};
