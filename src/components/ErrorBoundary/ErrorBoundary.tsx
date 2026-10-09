import * as React from 'react';
import { Card, Tooltip, Typography } from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

export interface ErrorBoundaryProps {
  children: React.ReactNode;
  // Short label shown in the fallback, e.g. "Layer unavailable".
  fallbackMessage: string;
  // defaultProps can't satisfy both react/static-property-placement and TS
  // for an optional prop on a class component, so these are left optional
  // without one and defaulted at the point of use instead.
  // eslint-disable-next-line react/require-default-props
  onError?: (error: Error) => void;
  // Extra style merged onto the fallback card, e.g. to float it in a
  // corner when the surrounding layout has no normal flow for it (such as
  // inside the map view, where children are rendered over the OL canvas).
  // eslint-disable-next-line react/require-default-props
  fallbackStyle?: React.CSSProperties;
}

interface ErrorBoundaryState {
  error: Error | null;
}

// Catches render errors thrown by its children so a single broken piece
// (e.g. one misconfigured layer) can't blank out the rest of the app.
// Give it a `key` that changes with whatever might cause the error (e.g.
// a layer id) so a retry with different input gets a fresh mount instead
// of staying stuck in the caught state.
export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error): void {
    const { onError } = this.props;
    onError?.(error);
  }

  render(): React.ReactNode {
    const { error } = this.state;
    const { children, fallbackMessage, fallbackStyle } = this.props;

    if (error) {
      return (
        <Tooltip title={error.message}>
          <Card
            className="layercomponent_item"
            style={{
              padding: '6px 10px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              ...fallbackStyle,
            }}
          >
            <WarningAmberIcon fontSize="small" sx={{ color: 'grey.500' }} />
            <Typography variant="body2" color="text.secondary">
              {fallbackMessage}
            </Typography>
          </Card>
        </Tooltip>
      );
    }

    return children;
  }
}

export default ErrorBoundary;
