/* eslint-disable react/jsx-props-no-spreading */
import * as React from 'react';
import { LayerType, getWMJSMapById } from '@opengeoweb/webmap';
import { MapView, MapViewLayer } from '@opengeoweb/webmap-react';
import { actions, useAppDispatch, useAppSelector } from '../store/store';
import { selectors } from '../store/selectors';
import { AdagucLayer, ViewerState } from '../store/types';
import { baseLayerWorldMap, overlayLayer } from '../utils/layerDefinitions';

export interface ReduxMapViewComponentProps {
  mapId: string;
  update: () => void;
}

export const ReduxMapViewComponent = ({
  mapId,
  update,
}: ReduxMapViewComponentProps): React.ReactElement<ReduxMapViewComponentProps> => {
  const dispatch = useAppDispatch();
  const mapLayers = useAppSelector((state: ViewerState): AdagucLayer[] =>
    selectors.getMapLayers(state, mapId),
  );

  const mapDimsNeedUpdate = () => {
    dispatch(actions.updateDims({ mapId }));
  };
  return (
    <MapView
      mapId={mapId}
      onMapChangeDimension={() => {
        mapDimsNeedUpdate();
      }}
      onUpdateLayerInformation={() => {
        update();
      }}
      onWMJSMount={(mountedMapId) => {
        const m = getWMJSMapById(mountedMapId) as unknown as {
          shouldPrefetch: boolean;
        };
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion, @typescript-eslint/no-non-null-assertion
        m.shouldPrefetch! = false;
      }}
    >
      <MapViewLayer {...baseLayerWorldMap} />
      {mapLayers.map((layer) => {
        return (
          <MapViewLayer
            key={layer.id}
            id={layer.id}
            service={layer.serviceUrl}
            style={layer.style}
            enabled={layer.enabled}
            opacity={layer.opacity || 1}
            layerType={LayerType.mapLayer}
            name={layer.name}
            dimensions={layer.dimensions}
            onLayerReady={() => {
              update();
            }}
          />
        );
      })}
      <MapViewLayer
        {...overlayLayer}
        type="baseLayer"
        layerType={LayerType.overLayer}
      />
    </MapView>
  );
};
