import * as React from 'react';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import type { LayerProps, WMSServiceInfo } from '@opengeoweb/webmap';
import { queryWMSLayers, queryWMSServiceInfo } from '@opengeoweb/webmap';
import AutoWMS from './AutoWMS';

jest.mock('@opengeoweb/webmap', () => ({
  queryWMSLayers: jest.fn(),
  queryWMSServiceInfo: jest.fn(),
}));

const mockQueryWMSLayers = jest.mocked(queryWMSLayers);
const mockQueryWMSServiceInfo = jest.mocked(queryWMSServiceInfo);

const AUTOWMS_URL = 'http://localhost:8080/autowms?';
const WMS_URL = 'http://example.com/wms?SERVICE=WMS&';

type FetchMockEntry = { url: string; init?: RequestInit };

const makeFetchMock = (
  handler: (url: string) => Promise<unknown>,
): jest.Mock => {
  const calls: FetchMockEntry[] = [];
  const mockFetch = jest.fn((url: string, init?: RequestInit) => {
    calls.push({ url, init });
    return handler(url).then((body) => ({
      json: () => Promise.resolve(body),
    }));
  });
  (mockFetch as unknown as { calls: FetchMockEntry[] }).calls = calls;
  return mockFetch;
};

const configJsonHandler = (url: string): Promise<unknown> => {
  if (url === './config.json') {
    return Promise.resolve({});
  }
  return Promise.resolve({ result: [] });
};

// Wait for the LinearProgress indicator to disappear, i.e. for the full
// fetch(...).then(...).finally(...) chain of an in-flight request to settle.
const waitForLoadingToFinish = async (): Promise<void> => {
  await waitFor(() => {
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });
};

// Flush the mount-time `fetch('./config.json')` effect before interacting.
const flushConfigFetch = async (mockFetch: jest.Mock): Promise<void> => {
  await waitFor(() => {
    expect(mockFetch).toHaveBeenCalledWith('./config.json');
  });
  await waitForLoadingToFinish();
};

describe('AutoWMS', () => {
  beforeEach(() => {
    mockQueryWMSLayers.mockReset();
    mockQueryWMSServiceInfo.mockReset();
  });

  afterEach(() => {
    jest.useRealTimers();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (global as any).fetch;
  });

  it('renders the AutoWMS input', async () => {
    const mockFetch = makeFetchMock(configJsonHandler);
    global.fetch = mockFetch as unknown as typeof fetch;

    render(<AutoWMS addLayer={jest.fn()} />);
    expect(
      screen.getByLabelText('Add AutoWMS or WMS service'),
    ).toBeInTheDocument();

    await flushConfigFetch(mockFetch);
  });

  it('does not fetch the explorer listing while the user is still typing', async () => {
    jest.useFakeTimers();
    const mockFetch = makeFetchMock(configJsonHandler);
    global.fetch = mockFetch as unknown as typeof fetch;

    render(<AutoWMS addLayer={jest.fn()} />);
    await flushConfigFetch(mockFetch);
    mockFetch.mockClear();

    const input = screen.getByLabelText('Add AutoWMS or WMS service');
    // Simulate typing character by character, as the user reported, without
    // letting the debounce timer settle between keystrokes.
    for (let i = 1; i <= AUTOWMS_URL.length; i += 1) {
      fireEvent.change(input, { target: { value: AUTOWMS_URL.slice(0, i) } });
    }

    expect(mockFetch).not.toHaveBeenCalled();

    // Once the user pauses, exactly one request is made, for the full url.
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        `${AUTOWMS_URL}request=getfiles&path=`,
      );
    });
    expect(mockFetch).toHaveBeenCalledTimes(1);
    await waitForLoadingToFinish();
  });

  it('fetches immediately when the Load button is clicked, without waiting for the debounce', async () => {
    jest.useFakeTimers();
    const mockFetch = makeFetchMock(configJsonHandler);
    global.fetch = mockFetch as unknown as typeof fetch;

    render(<AutoWMS addLayer={jest.fn()} />);
    await flushConfigFetch(mockFetch);
    mockFetch.mockClear();

    const input = screen.getByLabelText('Add AutoWMS or WMS service');
    fireEvent.change(input, { target: { value: AUTOWMS_URL } });

    // The Load button shares its (unhelpful) accessible name with other
    // icon buttons app-wide, but AutoWMS is rendered in isolation here so
    // it is the only "menu" labelled button in the tree.
    const loadButton = screen.getByRole('button', { name: 'menu' });
    fireEvent.click(loadButton);

    expect(mockFetch).toHaveBeenCalledWith(
      `${AUTOWMS_URL}request=getfiles&path=`,
    );
    await waitForLoadingToFinish();
  });

  it('fetches immediately when Enter is pressed in the input', async () => {
    jest.useFakeTimers();
    const mockFetch = makeFetchMock(configJsonHandler);
    global.fetch = mockFetch as unknown as typeof fetch;

    render(<AutoWMS addLayer={jest.fn()} />);
    await flushConfigFetch(mockFetch);
    mockFetch.mockClear();

    const input = screen.getByLabelText('Add AutoWMS or WMS service');
    fireEvent.change(input, { target: { value: AUTOWMS_URL } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(mockFetch).toHaveBeenCalledWith(
      `${AUTOWMS_URL}request=getfiles&path=`,
    );
    await waitForLoadingToFinish();
  });

  it('lists the layers of a WMS service and calls addLayer when one is selected', async () => {
    const mockFetch = makeFetchMock(configJsonHandler);
    global.fetch = mockFetch as unknown as typeof fetch;
    mockQueryWMSLayers.mockResolvedValue([
      {
        name: 'layer1',
        title: 'Layer One',
        styles: [],
      } as unknown as LayerProps,
    ]);
    mockQueryWMSServiceInfo.mockResolvedValue({
      abstract: 'Test abstract',
    } as unknown as WMSServiceInfo);

    const addLayer = jest.fn();
    render(<AutoWMS addLayer={addLayer} />);
    await flushConfigFetch(mockFetch);

    const input = screen.getByLabelText('Add AutoWMS or WMS service');
    fireEvent.change(input, { target: { value: WMS_URL } });
    fireEvent.click(screen.getByRole('button', { name: 'menu' }));

    await waitFor(() => {
      expect(mockQueryWMSLayers).toHaveBeenCalledWith(
        `${WMS_URL}SERVICE=WMS&REQUEST=GetCapabilities`,
        true,
      );
    });

    expect(await screen.findByText(/Layer One/)).toBeInTheDocument();
    expect(screen.getByText(/Test abstract/)).toBeInTheDocument();

    fireEvent.click(screen.getByAltText('Layer One'));
    expect(addLayer).toHaveBeenCalledWith(WMS_URL, 'layer1');
  });

  it('navigates into a subfolder of the AutoWMS explorer', async () => {
    const mockFetch = makeFetchMock((url) => {
      if (url === './config.json') {
        return Promise.resolve({});
      }
      if (url.includes('path=sub')) {
        return Promise.resolve({ result: [] });
      }
      if (url.includes('request=getfiles')) {
        return Promise.resolve({
          result: [{ path: 'sub', name: 'SubFolder', leaf: false }],
        });
      }
      return Promise.resolve({ result: [] });
    });
    global.fetch = mockFetch as unknown as typeof fetch;

    render(<AutoWMS addLayer={jest.fn()} />);
    await flushConfigFetch(mockFetch);

    const input = screen.getByLabelText('Add AutoWMS or WMS service');
    fireEvent.change(input, { target: { value: AUTOWMS_URL } });
    fireEvent.click(screen.getByRole('button', { name: 'menu' }));

    expect(await screen.findByText('SubFolder')).toBeInTheDocument();

    fireEvent.click(screen.getByText('SubFolder'));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('path=sub'),
      );
    });
    expect(screen.getByText(/Current path: sub/)).toBeInTheDocument();
    await waitForLoadingToFinish();
  });
});
