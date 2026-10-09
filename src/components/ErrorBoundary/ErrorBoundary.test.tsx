import * as React from 'react';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from './ErrorBoundary';

const Bomb = (): React.ReactElement => {
  throw new Error('boom');
};

describe('ErrorBoundary', () => {
  // React logs caught errors to console.error; keep test output clean.
  let consoleErrorSpy: jest.SpyInstance;
  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });
  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary fallbackMessage="Layer unavailable">
        <div>content</div>
      </ErrorBoundary>,
    );
    expect(screen.getByText('content')).toBeInTheDocument();
  });

  it('renders the fallback message instead of crashing when a child throws', () => {
    render(
      <ErrorBoundary fallbackMessage="Layer unavailable">
        <Bomb />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Layer unavailable')).toBeInTheDocument();
    expect(screen.queryByText('content')).not.toBeInTheDocument();
  });

  it('calls onError with the thrown error', () => {
    const onError = jest.fn();
    render(
      <ErrorBoundary fallbackMessage="Layer unavailable" onError={onError}>
        <Bomb />
      </ErrorBoundary>,
    );
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'boom',
      }),
    );
  });
});
