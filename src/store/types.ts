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
}

export interface AdagucService {
  id: string;
  serviceUrl: string;
  layers: LayerProps[];
}

export interface AdagucMap {
  layers: AdagucLayer[];
}
export interface AdagucMapsState {
  maps: Record<string, AdagucMap>;
  services: Record<string, AdagucService>;
}

export interface ViewerState {
  viewer: AdagucMapsState;
}
