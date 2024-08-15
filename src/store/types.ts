import { LayerProps } from '@opengeoweb/webmap';

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
}

export interface AdagucService {
  id: string;
  serviceUrl: string;
  layers: LayerProps[];
}

export interface AdagucMap {
  isAnimating: boolean;
  layers: AdagucLayer[];
}
export interface AdagucMapsState {
  maps: Record<string, AdagucMap>;
  services: Record<string, AdagucService>;
}

export interface ViewerState {
  viewer: AdagucMapsState;
}
