import * as React from 'react';
import { render, screen } from '@testing-library/react';
import { useAppSelector } from '../../store/store';
import { ViewerState, AdagucLayer } from '../../store/types';
import LegendPanel from './LegendPanel';

interface MockStyle {
  name: string;
  legendURL: string;
  title: string;
  abstract: string;
}

interface MockWMLayer {
  id: string;
  legendGraphic: string;
  currentStyle: string;
  getStyles: () => MockStyle[];
  setStyle: (styleName: string) => void;
}

const mockGetWMLayerById = jest.fn<MockWMLayer | undefined, [string]>();

jest.mock('@opengeoweb/webmap', () => ({
  getWMLayerById: (id: string) => mockGetWMLayerById(id),
  // A simplified stand-in for the real getLegendGraphicURLForLayer, which
  // this test only needs to read layer.legendGraphic from (the dims/SLD/
  // width/height extras it also appends aren't relevant to this bug).
  getLegendGraphicURLForLayer: (layer: MockWMLayer | undefined) =>
    layer?.legendGraphic || undefined,
  legendImageStore: { clear: jest.fn() },
}));

jest.mock('@opengeoweb/webmap-react', () => ({
  clearImageCacheForAllMaps: jest.fn(),
}));

jest.mock('../../store/store', () => ({
  useAppSelector: jest.fn(),
}));

const mockUseAppSelector = jest.mocked(useAppSelector);

const STYLES: MockStyle[] = [
  {
    name: 'style-a',
    legendURL: 'https://example.com/legend-a.png',
    title: 'A',
    abstract: '',
  },
  {
    name: 'style-b',
    legendURL: 'https://example.com/legend-b.png',
    title: 'B',
    abstract: '',
  },
];

// Mirrors the real WMLayer.setStyle: on a match, mutate legendGraphic/
// currentStyle to that style; otherwise fall back to the first style.
const makeMockWMLayer = (initialStyle: string): MockWMLayer => {
  const wmLayer: MockWMLayer = {
    id: 'layer-1',
    legendGraphic: '',
    currentStyle: '',
    getStyles: () => STYLES,
    setStyle: (styleName) => {
      const match = STYLES.find((style) => style.name === styleName);
      const resolved = match ?? STYLES[0];
      wmLayer.legendGraphic = resolved.legendURL;
      wmLayer.currentStyle = resolved.name;
    },
  };
  wmLayer.setStyle(initialStyle);
  return wmLayer;
};

const mapId = 'map1';

const makeLayer = (overrides: Partial<AdagucLayer> = {}): AdagucLayer => ({
  id: 'layer-1',
  name: 'layer-1',
  serviceUrl: 'https://example.com/wms?',
  style: 'style-a',
  dimensions: [],
  enabled: true,
  opacity: 1,
  ...overrides,
});

const buildState = (layers: AdagucLayer[]): ViewerState => ({
  viewer: {
    services: {},
    baseLayers: [],
    maps: {
      [mapId]: {
        isAnimating: false,
        isGetFeatureInfoActive: false,
        isHistogramBoxSelectActive: false,
        layers,
        view: {
          srs: 'EPSG:3857',
          bbox: { left: -1, bottom: -1, right: 1, top: 1 },
        },
      },
    },
  },
});

describe('LegendPanel', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("shows the legend image for the layer's current style", async () => {
    const wmLayer = makeMockWMLayer('style-a');
    mockGetWMLayerById.mockReturnValue(wmLayer);
    const state = buildState([makeLayer({ style: 'style-a' })]);
    mockUseAppSelector.mockImplementation((selector) => selector(state));

    render(<LegendPanel mapId={mapId} />);

    expect(await screen.findByAltText('Legend for layer-1')).toHaveAttribute(
      'src',
      expect.stringContaining('legend-a.png'),
    );
  });

  it('updates the legend image when the layer style changes, even if nothing else has synced the WMLayer yet', async () => {
    const wmLayer = makeMockWMLayer('style-a');
    mockGetWMLayerById.mockReturnValue(wmLayer);
    let state = buildState([makeLayer({ style: 'style-a' })]);
    mockUseAppSelector.mockImplementation((selector) => selector(state));

    const { rerender } = render(<LegendPanel mapId={mapId} />);
    expect(await screen.findByAltText('Legend for layer-1')).toHaveAttribute(
      'src',
      expect.stringContaining('legend-a.png'),
    );

    // Simulate the style dropdown's redux update - note nothing here calls
    // wmLayer.setStyle('style-b') the way the real map layer's own effect
    // normally would, which is exactly the race this fix removes the
    // panel's dependency on.
    state = buildState([makeLayer({ style: 'style-b' })]);
    mockUseAppSelector.mockImplementation((selector) => selector(state));
    rerender(<LegendPanel mapId={mapId} />);

    expect(await screen.findByAltText('Legend for layer-1')).toHaveAttribute(
      'src',
      expect.stringContaining('legend-b.png'),
    );
  });
});
