import 'regenerator-runtime/runtime';
import { Provider } from 'react-redux';
import { ThemeWrapper } from '@opengeoweb/theme';
import React from 'react';
import store from '../store/store';
import ReduxMap from '../connectedcomponents/ReduxMap';

const App = (): React.ReactElement => {
  // Note: The used config variable is a global var defined in index.html
  return (
    <ThemeWrapper>
      <Provider store={store}>
        <ReduxMap />
      </Provider>
    </ThemeWrapper>
  );
};

export default App;
