import * as React from 'react';
import { render, screen } from '@testing-library/react';
import AdagucAppBar from './AdagucAppBar';

jest.mock('./AdagucAddDataDialog', () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock('./AdagucCreatePermalinkDialog', () => ({
  __esModule: true,
  default: () => null,
}));

// The service-url routing/history logic itself lives in, and is fully
// covered by, WMSServiceInput.test.tsx - here, only that AdagucAppBar
// actually renders it is under test.
jest.mock('./WMSServiceInput', () => ({
  __esModule: true,
  default: () => <div data-testid="wms-service-input" />,
}));

describe('AdagucAppBar', () => {
  it('renders the shared WMS/AutoWMS service input', () => {
    render(<AdagucAppBar />);

    expect(screen.getByTestId('wms-service-input')).toBeInTheDocument();
  });
});
