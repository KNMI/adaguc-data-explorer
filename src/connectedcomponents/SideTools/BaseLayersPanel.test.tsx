import * as React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { useAppDispatch, useAppSelector } from '../../store/store';
import { AdagucBaseLayer } from '../../store/types';
import BaseLayersPanel from './BaseLayersPanel';

jest.mock('@opengeoweb/webmap', () => ({
  LayerType: { baseLayer: 'baseLayer', overLayer: 'overLayer' },
}));

jest.mock('../../store/store', () => ({
  actions: {
    setBaseLayerEnabled: (payload: unknown) => ({
      type: 'wmsservices/setBaseLayerEnabled',
      payload,
    }),
  },
  useAppDispatch: jest.fn(),
  useAppSelector: jest.fn(),
}));

const mockUseAppDispatch = jest.mocked(useAppDispatch);
const mockUseAppSelector = jest.mocked(useAppSelector);

const baseMap: AdagucBaseLayer = {
  id: 'baselayer-worldmap',
  name: 'WorldMap',
  title: 'KNMI Basemap',
  type: 'twms',
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  layerType: 'baseLayer' as any,
  enabled: true,
};

const overlay: AdagucBaseLayer = {
  id: 'overlay-countryborders',
  name: 'countryborders',
  title: 'World country borders',
  format: 'image/png',
  service: 'https://geoservices.knmi.nl/wms?DATASET=baselayers&',
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  layerType: 'overLayer' as any,
  enabled: false,
};

describe('BaseLayersPanel', () => {
  let mockDispatch: jest.Mock;

  beforeEach(() => {
    mockDispatch = jest.fn();
    mockUseAppDispatch.mockReturnValue(mockDispatch);
    mockUseAppSelector.mockImplementation((selector) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      selector({ viewer: { baseLayers: [baseMap, overlay] } } as any),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders base maps and overlays with their current enabled state', () => {
    render(<BaseLayersPanel />);

    expect(screen.getByText('KNMI Basemap')).toBeInTheDocument();
    expect(screen.getByText('World country borders')).toBeInTheDocument();
    expect(
      screen.getByRole('checkbox', { name: 'KNMI Basemap' }),
    ).toBeChecked();
    expect(
      screen.getByRole('checkbox', { name: 'World country borders' }),
    ).not.toBeChecked();
  });

  it('dispatches setBaseLayerEnabled when a checkbox is toggled', () => {
    render(<BaseLayersPanel />);

    fireEvent.click(screen.getByRole('checkbox', { name: 'KNMI Basemap' }));

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'wmsservices/setBaseLayerEnabled',
      payload: { id: 'baselayer-worldmap', enabled: false },
    });

    fireEvent.click(
      screen.getByRole('checkbox', { name: 'World country borders' }),
    );

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'wmsservices/setBaseLayerEnabled',
      payload: { id: 'overlay-countryborders', enabled: true },
    });
  });
});
