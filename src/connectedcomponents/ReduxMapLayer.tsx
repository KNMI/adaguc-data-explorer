/* eslint-disable react/jsx-props-no-spreading */
import * as React from 'react';
import { LayerType } from '@opengeoweb/webmap';
import {
  OnInitializeLayerProps,
  OpenLayersLayer,
  OpenLayersLayerProps,
  useAnimationForLayer,
} from '@opengeoweb/webmap-react';
import { AdagucLayer } from '../store/types';

export interface ReduxMapLayerProps {
  layer: AdagucLayer;
  isAnimating: boolean;
  onLayerReady: () => void;
  onLayerError: () => void;
  onInitializeLayer: (payload: OnInitializeLayerProps) => void;
}

const ANIMATION_INTERVAL_MS = 300;
const ANIMATION_NUM_STEPS = 24;

const getLayerProps = (layer: AdagucLayer): OpenLayersLayerProps => ({
  id: layer.id,
  service: layer.serviceUrl,
  style: layer.style,
  enabled: layer.enabled,
  opacity: layer.opacity || 1,
  layerType: LayerType.mapLayer,
  name: layer.name,
  dimensions: layer.dimensions,
});

interface InnerLayerProps {
  layer: AdagucLayer;
  onLayerReady: () => void;
  onLayerError: () => void;
  onInitializeLayer: (payload: OnInitializeLayerProps) => void;
}

// Renders the layer with its redux-tracked dimensions. Used whenever this
// layer isn't animating, so it never mounts useAnimationForLayer, which
// polls on its own interval regardless of whether its output is used.
const StaticMapLayer = ({
  layer,
  onLayerReady,
  onLayerError,
  onInitializeLayer,
}: InnerLayerProps): React.ReactElement => (
  <OpenLayersLayer
    {...getLayerProps(layer)}
    onLayerReady={onLayerReady}
    onLayerError={onLayerError}
    onInitializeLayer={onInitializeLayer}
  />
);

// Renders the layer with time-animated dimensions, stepping through the
// most recent time values on an interval.
const AnimatedMapLayer = ({
  layer,
  onLayerReady,
  onLayerError,
  onInitializeLayer,
}: InnerLayerProps): React.ReactElement => {
  const layerProps = getLayerProps(layer);
  const { dimensions: animatedDimensions } = useAnimationForLayer(
    layerProps,
    ANIMATION_INTERVAL_MS,
    ANIMATION_NUM_STEPS,
  );

  return (
    <OpenLayersLayer
      {...layerProps}
      dimensions={animatedDimensions}
      onLayerReady={onLayerReady}
      onLayerError={onLayerError}
      onInitializeLayer={onInitializeLayer}
    />
  );
};

export const ReduxMapLayer = ({
  layer,
  isAnimating,
  onLayerReady,
  onLayerError,
  onInitializeLayer,
}: ReduxMapLayerProps): React.ReactElement => {
  if (isAnimating) {
    return (
      <AnimatedMapLayer
        layer={layer}
        onLayerReady={onLayerReady}
        onLayerError={onLayerError}
        onInitializeLayer={onInitializeLayer}
      />
    );
  }
  return (
    <StaticMapLayer
      layer={layer}
      onLayerReady={onLayerReady}
      onLayerError={onLayerError}
      onInitializeLayer={onInitializeLayer}
    />
  );
};
