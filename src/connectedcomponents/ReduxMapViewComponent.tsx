/* eslint-disable react/jsx-props-no-spreading */
import * as React from 'react';
import { View } from 'ol';
import { debounce } from 'lodash';
import { getWMLayerById } from '@opengeoweb/webmap';
import {
  OpenLayersMapView,
  OpenLayersLayer,
  OpenLayersGetFeatureInfo,
  getLayerExtentForProjection,
  setViewFromExtent,
  makeView,
  MapLocation,
} from '@opengeoweb/webmap-react';
import { actions, useAppDispatch, useAppSelector } from '../store/store';
import { selectors } from '../store/selectors';
import { AdagucLayer, AdagucMapView, ViewerState } from '../store/types';
import { baseLayerWorldMap, overlayLayer } from '../utils/layerDefinitions';
import { ReduxMapLayer } from './ReduxMapLayer';
import { ErrorBoundary } from '../components/ErrorBoundary/ErrorBoundary';

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
  const mapView = useAppSelector(
    (state: ViewerState): AdagucMapView => state?.viewer?.maps[mapId]?.view,
  );
  const viewCommand = useAppSelector(
    (state: ViewerState) => state?.viewer?.maps[mapId]?.viewCommand,
  );
  const zoomToLayerCommand = useAppSelector(
    (state: ViewerState) => state?.viewer?.maps[mapId]?.zoomToLayerCommand,
  );
  const isGetFeatureInfoActive = useAppSelector(
    (state: ViewerState): boolean =>
      state?.viewer?.maps[mapId]?.isGetFeatureInfoActive,
  );
  const isAnimating = useAppSelector(
    (state: ViewerState): boolean => state?.viewer?.maps[mapId]?.isAnimating,
  );
  const mapPinLocation = useAppSelector(
    (state: ViewerState): MapLocation =>
      state?.viewer?.maps[mapId]?.mapPinLocation,
  );

  const [view, setView] = React.useState<View>(() =>
    makeView(mapView?.srs || 'EPSG:3857'),
  );
  const lastAppliedViewCommandId = React.useRef<number>(0);
  const lastAppliedZoomCommandId = React.useRef<number>(0);

  React.useEffect(() => {
    if (
      !viewCommand ||
      viewCommand.requestId === lastAppliedViewCommandId.current
    ) {
      return;
    }
    lastAppliedViewCommandId.current = viewCommand.requestId;
    const newView = makeView(viewCommand.srs);
    setViewFromExtent(newView, viewCommand.bbox);
    setView(newView);
  }, [viewCommand]);

  React.useEffect(() => {
    if (
      !zoomToLayerCommand ||
      zoomToLayerCommand.requestId === lastAppliedZoomCommandId.current
    ) {
      return;
    }
    lastAppliedZoomCommandId.current = zoomToLayerCommand.requestId;
    const wmLayer = getWMLayerById(zoomToLayerCommand.layerId);
    const extent =
      wmLayer &&
      getLayerExtentForProjection(wmLayer, view.getProjection().getCode());
    if (extent) {
      view.fit(extent);
    }
  }, [zoomToLayerCommand, view]);

  React.useEffect(() => {
    const onViewChange = debounce(() => {
      try {
        const extent = view.calculateExtent();
        dispatch(
          actions.updateMapView({
            mapId,
            view: {
              srs: view.getProjection().getCode(),
              bbox: {
                left: extent[0],
                bottom: extent[1],
                right: extent[2],
                top: extent[3],
              },
            },
          }),
        );
      } catch {
        // View size is not known yet, nothing to sync.
      }
    }, 200);
    view.on('change', onViewChange);
    return () => {
      view.un('change', onViewChange);
    };
  }, [view, mapId, dispatch]);

  return (
    <OpenLayersMapView view={view} mapId={mapId}>
      <OpenLayersLayer {...baseLayerWorldMap} />
      {mapLayers.map((layer) => {
        return (
          <ErrorBoundary
            key={layer.id}
            fallbackMessage={`Layer "${layer.name}" failed to render`}
            fallbackStyle={{
              position: 'absolute',
              top: 8,
              left: 8,
              zIndex: 1,
            }}
          >
            <ReduxMapLayer
              layer={layer}
              isAnimating={isAnimating}
              onLayerReady={() => {
                update();
              }}
              onLayerError={() => {
                update();
              }}
              onInitializeLayer={({ layerId, style, dimensions }) => {
                dispatch(
                  actions.initializeLayer({
                    mapId,
                    layerId,
                    style,
                    dimensions: dimensions
                      ?.filter((dimension) => dimension.name)
                      .map((dimension) => ({
                        name: dimension.name,
                        currentValue: dimension.currentValue,
                      })),
                  }),
                );
              }}
            />
          </ErrorBoundary>
        );
      })}
      <OpenLayersLayer {...overlayLayer} />
      <OpenLayersGetFeatureInfo
        displayMapPin={isGetFeatureInfoActive}
        mapPinLocation={mapPinLocation}
        selectLocation={(location) => {
          if (isGetFeatureInfoActive) {
            dispatch(actions.setMapPinLocation({ mapId, location }));
          }
        }}
      />
    </OpenLayersMapView>
  );
};
