/* eslint-disable react/jsx-props-no-spreading */
import * as React from 'react';
import { render, screen } from '@testing-library/react';
import { getWMLayerById } from '@opengeoweb/webmap';
import { LayerComponent } from './LayerComponent';
import { AdagucLayer } from '../../store/types';

jest.mock('@opengeoweb/webmap', () => ({
  getWMLayerById: jest.fn(),
}));

jest.mock('./WMSLayerSelector', () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock('../WMSComponents/WMSStyleSelector', () => ({
  __esModule: true,
  default: () => null,
}));

const mockGetWMLayerById = jest.mocked(getWMLayerById);

const baseLayer: AdagucLayer = {
  id: 'layer-1',
  name: 'air_pressure_msl',
  serviceUrl: 'http://localhost:8080/adagucserver',
  style: 'default',
  dimensions: [],
  enabled: true,
  opacity: 1,
};

const requiredProps = {
  serviceUrl: baseLayer.serviceUrl,
  layerIndex: 0,
  selectedStyleName: 'default',
  styles: [],
  isAnimating: false,
  onSelectLayer: jest.fn(),
  openLayerDetails: jest.fn(),
  onSelectStyle: jest.fn(),
  onChangeLayerEnabled: jest.fn(),
  onChangeOpacity: jest.fn(),
  onDuplicate: jest.fn(),
  getDimensionValue: jest.fn(),
  setDimensionValue: jest.fn(),
  removeLayer: jest.fn(),
  layerToggleAnimation: jest.fn(),
  zoomToLayer: jest.fn(),
  update: jest.fn(),
};

describe('LayerComponent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetWMLayerById.mockReturnValue(undefined);
  });

  it('shows the error icon with a tooltip when the layer has an error', () => {
    render(
      <LayerComponent
        {...requiredProps}
        layer={{ ...baseLayer, hasError: true }}
      />,
    );

    const icon = screen.getByTestId('WarningAmberIcon');
    expect(icon).toBeInTheDocument();
    // MUI's Tooltip sets the title as an aria-label on its child rather
    // than rendering visible text until hovered/focused.
    expect(icon).toHaveAttribute('aria-label', 'Layer has an error');
  });

  it('does not show the error icon when the layer has no error', () => {
    render(
      <LayerComponent
        {...requiredProps}
        layer={{ ...baseLayer, hasError: false }}
      />,
    );

    expect(screen.queryByTestId('WarningAmberIcon')).not.toBeInTheDocument();
  });

  it('does not show the error icon when hasError is undefined', () => {
    render(<LayerComponent {...requiredProps} layer={baseLayer} />);

    expect(screen.queryByTestId('WarningAmberIcon')).not.toBeInTheDocument();
  });
});
