import { Provider } from 'react-redux';
import * as React from 'react';

import { ThemeWrapper } from '@opengeoweb/theme';
import store from '../src/store/store';
import ReduxMap from '../src/connectedcomponents/ReduxMap';

export const ReduxMapStory = (): React.ReactElement => {
  return (
    <ThemeWrapper>
      <Provider store={store}>
        <ReduxMap />
      </Provider>
    </ThemeWrapper>
  );
};

ReduxMapStory.storyName = 'ReduxMapStory';

export default {
  title: 'ReduxStoreTest',
};
