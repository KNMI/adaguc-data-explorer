import 'regenerator-runtime/runtime';
import { Provider } from 'react-redux';
import { QueryClientProvider } from '@tanstack/react-query';
import { ThemeWrapper } from '@opengeoweb/theme';
import { wmsQueryClient } from '@opengeoweb/webmap';
import React from 'react';
import store from '../store/store';
import ReduxMap from '../connectedcomponents/ReduxMap';

const App = (): React.ReactElement => {
  // Note: The used config variable is a global var defined in index.html
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

export default App;
