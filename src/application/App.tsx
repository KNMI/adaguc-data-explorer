import 'regenerator-runtime/runtime';
import { ThemeWrapper } from '@opengeoweb/theme';
import React from 'react';
import { DemoWMSViewer } from '../components/DemoWMSViewer';

const App = (): React.ReactElement => {
  // Note: The used config variable is a global var defined in index.html
  return (
    <ThemeWrapper>
      <div
        style={{
          background: 'white',
          width: '100vw',
          height: '100vh',
          margin: 0,
          padding: 20,
        }}
      >
        <DemoWMSViewer />
      </div>
    </ThemeWrapper>
  );
};

export default App;
