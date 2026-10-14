import * as React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import AdagucAppBar from './AdagucAppBar';

jest.mock('./AdagucAddDataDialog', () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock('./AdagucCreatePermalinkDialog', () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock('./PredefinedAreasDialog', () => ({
  __esModule: true,
  default: ({ isDialogOpen }: { isDialogOpen: boolean }) =>
    isDialogOpen ? <div data-testid="predefined-areas-dialog" /> : null,
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

  it('opens the predefined areas dialog from its toolbar button', () => {
    render(<AdagucAppBar />);

    expect(
      screen.queryByTestId('predefined-areas-dialog'),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Predefined areas' }));

    expect(screen.getByTestId('predefined-areas-dialog')).toBeInTheDocument();
  });

  it('shows the logo on the right of the toolbar, which opens the about dialog', () => {
    render(<AdagucAppBar />);

    expect(
      screen.queryByText('About Adaguc Data Explorer'),
    ).not.toBeInTheDocument();

    const toolbarButtons = screen.getAllByRole('button');
    // The logo button is the last toolbar control, after the permalink one.
    expect(toolbarButtons[toolbarButtons.length - 1]).toHaveAccessibleName(
      'About Adaguc Data Explorer',
    );

    fireEvent.click(
      screen.getByRole('button', { name: 'About Adaguc Data Explorer' }),
    );

    expect(screen.getByText('About Adaguc Data Explorer')).toBeInTheDocument();
  });
});
