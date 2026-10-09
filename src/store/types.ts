import { Bbox, LayerProps } from '@opengeoweb/webmap';
import { MapLocation } from '@opengeoweb/webmap-react';

export interface AdagucLayerDimension {
  name: string;
  currentValue: string;
}
export interface AdagucLayer {
  name: string;
  serviceUrl: string;
  id: string;
  style: string;
  dimensions: AdagucLayerDimension[];
  enabled: boolean;
  opacity: number;
  // Flips to true once the layer's WMS capabilities have been parsed (see
  // the initializeLayer reducer). Exists purely so that, unlike dimensions
  // or style, this is guaranteed to be a real value change the first time
  // it happens — selectors here use a deep-equality result check, so
  // dispatching data that happens to already match redux's current value
  // (the common case, since the add-layer thunk already parses once) would
  // otherwise never cause the layer panel to re-render and pick up the
  // live WMLayer instance (title, dimension ranges) it reads separately.
  isReady?: boolean;
}

export interface AdagucService {
  id: string;
  serviceUrl: string;
  layers: LayerProps[];
}

export interface AdagucMapView {
  srs: string;
  bbox: Bbox;
}

export interface AdagucViewCommand {
  srs: string;
  bbox: Bbox;
  requestId: number;
}

export interface AdagucZoomToLayerCommand {
  layerId: string;
  requestId: number;
}

export interface AdagucMap {
  isAnimating: boolean;
  layers: AdagucLayer[];
  view: AdagucMapView;
  viewCommand?: AdagucViewCommand;
  zoomToLayerCommand?: AdagucZoomToLayerCommand;
  isGetFeatureInfoActive: boolean;
  mapPinLocation?: MapLocation;
}
export interface AdagucMapsState {
  maps: Record<string, AdagucMap>;
  services: Record<string, AdagucService>;
}

export interface ViewerState {
  viewer: AdagucMapsState;
}
