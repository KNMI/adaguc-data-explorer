import * as React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { useAppDispatch, useAppSelector } from '../../store/store';
import SideToolPanel from './SideToolPanel';

jest.mock('../../store/thunks', () => ({
  thunks: { addLayer: jest.fn() },
}));

// The panels' own content/behaviour isn't under test here - only how
// SideToolPanel drives the shared pin-mode flag as tabs change.
jest.mock('./AutoWMS', () => ({ __esModule: true, default: () => null }));
jest.mock('./GetFeatureInfoPanel', () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock('./LegendPanel', () => ({ __esModule: true, default: () => null }));
jest.mock('./TimeSeriesPanel', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('../../store/store', () => ({
  actions: {
    setGetFeatureInfoActive: (payload: unknown) => ({
      type: 'wmsservices/setGetFeatureInfoActive',
      payload,
    }),
  },
  useAppDispatch: jest.fn(),
  useAppSelector: jest.fn(),
}));

const mockUseAppDispatch = jest.mocked(useAppDispatch);
const mockUseAppSelector = jest.mocked(useAppSelector);

const PIN_MODE_ACTION = 'wmsservices/setGetFeatureInfoActive';

interface DispatchedAction {
  type: string;
  payload: { mapId: string; active: boolean };
}

describe('SideToolPanel', () => {
  let mockDispatch: jest.Mock;

  beforeEach(() => {
    mockDispatch = jest.fn();
    mockUseAppDispatch.mockReturnValue(mockDispatch);
    mockUseAppSelector.mockImplementation((selector) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      selector({ viewer: {} } as any),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const pinModeDispatches = (): Array<{ mapId: string; active: boolean }> =>
    (mockDispatch.mock.calls as [DispatchedAction][])
      .map(([dispatchedAction]) => dispatchedAction)
      .filter((dispatchedAction) => dispatchedAction.type === PIN_MODE_ACTION)
      .map((dispatchedAction) => dispatchedAction.payload);

  it('turns pin mode on for GetFeatureInfo and off for AutoWMS', () => {
    render(
      <SideToolPanel toolsPanelIsExpanded toggleExpandToolsPanel={jest.fn()} />,
    );

    // AUTOWMS is the default tab, so pin mode starts off.
    expect(pinModeDispatches().at(-1)).toEqual({
      mapId: 'map1',
      active: false,
    });

    act(() => {
      fireEvent.click(screen.getByText('GetFeatureInfo'));
    });
    expect(pinModeDispatches().at(-1)).toEqual({
      mapId: 'map1',
      active: true,
    });

    act(() => {
      fireEvent.click(screen.getByText('AutoWMS'));
    });
    expect(pinModeDispatches().at(-1)).toEqual({
      mapId: 'map1',
      active: false,
    });
  });

  it('keeps pin mode on when switching directly from GetFeatureInfo to TimeSeries', () => {
    render(
      <SideToolPanel toolsPanelIsExpanded toggleExpandToolsPanel={jest.fn()} />,
    );

    act(() => {
      fireEvent.click(screen.getByText('GetFeatureInfo'));
    });
    mockDispatch.mockClear();

    act(() => {
      fireEvent.click(screen.getByText('TimeSeries'));
    });

    // Regression guard: GetFeatureInfoPanel and TimeSeriesPanel used to each
    // toggle this flag from their own `active` prop in their own effect,
    // which raced when both re-rendered in the same commit - switching tabs
    // could leave pin mode off depending on which panel was declared last
    // in the JSX. SideToolPanel now derives a single boolean from the tab,
    // which stays true across this switch (both tabs want pin mode on), so
    // it correctly doesn't even re-dispatch - above all, it must never
    // dispatch `active: false` while on either of these two tabs.
    expect(pinModeDispatches()).not.toContainEqual({
      mapId: 'map1',
      active: false,
    });
  });

  it('switches to the AutoWMS tab when an AutoWMS service command arrives', () => {
    // Regression guard: the top bar's "custom WMS service" field (see
    // AdagucAppBar) can send an AutoWMS explorer url here instead of
    // adding a layer - that's only useful if the user actually lands on
    // the tab showing it.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let state: any = { viewer: {} };
    mockUseAppSelector.mockImplementation((selector) => selector(state));

    const { rerender } = render(
      <SideToolPanel toolsPanelIsExpanded toggleExpandToolsPanel={jest.fn()} />,
    );

    act(() => {
      fireEvent.click(screen.getByText('GetFeatureInfo'));
    });
    expect(screen.getByText('GetFeatureInfo').getAttribute('class')).toContain(
      'MuiButton-contained',
    );

    state = {
      viewer: {
        autoWMSServiceCommand: { service: 'http://x/autowms?', requestId: 1 },
      },
    };
    act(() => {
      rerender(
        <SideToolPanel
          toolsPanelIsExpanded
          toggleExpandToolsPanel={jest.fn()}
        />,
      );
    });

    expect(screen.getByText('AutoWMS').getAttribute('class')).toContain(
      'MuiButton-contained',
    );
  });
});
