import * as React from 'react';
import { Style, generateLayerId, getWMJSMapById } from '@opengeoweb/webmap';
import { actions, useAppDispatch, useAppSelector } from '../store/store';
import { selectors } from '../store/selectors';
import { AdagucLayer, ViewerState } from '../store/types';
import { LayerComponent } from '../components/LayerComponent/LayerComponent';

export interface ReduxLayerComponentProps {
  mapId: string;
  layerId: string;
  layerIndex: number;
}

export const ReduxLayerComponent = ({
  mapId,
  layerId,
  layerIndex,
}: ReduxLayerComponentProps) => {
  const dispatch = useAppDispatch();

  const selectLayer = (layerNameToChange: string) => {
    dispatch(
      actions.changeLayerName({
        mapId,
        layerIndex,
        layerName: layerNameToChange,
      }),
    );
  };

  const onDuplicateLayer = (layer: AdagucLayer) => {
    dispatch(
      actions.fullFillAddLayer({
        mapId,
        ...layer,
        id: generateLayerId(),
      }),
    );
  };

  const selectStyle = (styleNameToChange: string) => {
    dispatch(
      actions.changeLayerStyle({
        mapId,
        layerIndex,
        styleName: styleNameToChange,
      }),
    );
  };

  const layer = useAppSelector(
    (state: ViewerState): AdagucLayer =>
      selectors.getMapLayerById(state, mapId, layerId),
  );

  const styleList = useAppSelector((state: ViewerState): Style[] =>
    selectors.getStyleListForLayer(state, layer),
  );

  const isAnimating = useAppSelector((state: ViewerState): boolean =>
    selectors.isMapAnimating(state, mapId),
  );

  // const availableLayers = useAppSelector((state: ViewerState): LayerProps[] =>
  //   selectors.getAvailableLayers(state, layer?.serviceUrl),
  // );

  const changeLayerDimension = (
    dimensionName: string,
    dimensionValue: string,
  ) => {
    dispatch(
      actions.changeLayerDimension({
        mapId,
        layerIndex,
        dimensionName,
        dimensionValue,
      }),
    );
  };

  const removeLayer = () => {
    dispatch(
      actions.removeLayer({
        mapId,
        layerIndex,
      }),
    );
  };

  const layerToggleAnimation = () => {
    dispatch(
      actions.layerToggleAnimation({
        mapId,
        layerIndex,
      }),
    );
  };

  const changeLayerOpacity = (opacity: number) => {
    dispatch(
      actions.layerChangeOpacity({
        mapId,
        layerIndex,
        opacity,
      }),
    );
  };

  const changeLayerEnabled = (enabled: boolean) => {
    dispatch(
      actions.layerChangeEnabled({
        mapId,
        layerIndex,
        enabled,
      }),
    );
  };
  return (
    <LayerComponent
      layer={layer}
      layerIndex={layerIndex}
      key={layer?.id}
      serviceUrl={layer?.serviceUrl}
      isAnimating={isAnimating}
      onDuplicate={() => {
        onDuplicateLayer(layer);
      }}
      onSelectLayer={(_layer) => {
        selectLayer(_layer);
      }}
      onChangeOpacity={(opacity) => {
        changeLayerOpacity(opacity);
      }}
      onChangeLayerEnabled={(enabled) => {
        changeLayerEnabled(enabled);
      }}
      getDimensionValue={(dimensionName: string): string => {
        const foundDim = layer?.dimensions?.find(
          (dim) => dim.name === dimensionName,
        );
        return foundDim?.currentValue;
      }}
      setDimensionValue={(
        dimensionName: string,
        dimensionValue: string,
      ): void => {
        changeLayerDimension(dimensionName, dimensionValue);
      }}
      update={(): void => {
        getWMJSMapById(mapId).draw();
      }}
      styles={styleList}
      selectedStyleName={layer?.style}
      onSelectStyle={(style: string): void => {
        selectStyle(style);
      }}
      removeLayer={() => {
        removeLayer();
      }}
      layerToggleAnimation={() => {
        layerToggleAnimation();
      }}
    />
  );
};
