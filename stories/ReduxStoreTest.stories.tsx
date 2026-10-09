import { Provider } from 'react-redux';
import * as React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';

import { ThemeWrapper } from '@opengeoweb/theme';
import { wmsQueryClient } from '@opengeoweb/webmap';
import store from '../src/store/store';
import AddDataComponent from '../src/connectedcomponents/AddDataComponent';
import ReduxMap from '../src/connectedcomponents/ReduxMap';

export const ReduxMapStory = (): React.ReactElement => {
  return (
    <ThemeWrapper>
      <QueryClientProvider client={wmsQueryClient}>
        <Provider store={store}>
          <ReduxMap />
        </Provider>
      </QueryClientProvider>
    </ThemeWrapper>
  );
};

ReduxMapStory.storyName = 'ReduxMapStory';

export const AddData = (): React.ReactElement => {
  return (
    <ThemeWrapper>
      <QueryClientProvider client={wmsQueryClient}>
        <Provider store={store}>
          <AddDataComponent handleAddData={() => {}} />
        </Provider>
      </QueryClientProvider>
    </ThemeWrapper>
  );
};

AddData.storyName = 'AddData';

export default {
  title: 'ReduxStoreTest',
};
