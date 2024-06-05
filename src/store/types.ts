import { LayerProps } from '@opengeoweb/webmap';

export type AdagucLayer = LayerProps;

export interface AdagucServices {
  id: string;
  serviceUrl: string;
  layers: AdagucLayer[];
}
export interface AdagucMapsState {
  maps: Record<string, { layers: AdagucLayer[] }>;
  services: Record<string, AdagucServices>;
}

export interface ViewerState {
  viewer: AdagucMapsState;
}
