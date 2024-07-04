import * as React from 'react';
import { ReactSortable } from 'react-sortablejs';
import { actions, useAppDispatch, useAppSelector } from '../store/store';
import { selectors } from '../store/selectors';
import { ViewerState } from '../store/types';
import { ReduxLayerComponent } from './ReduxLayerComponent';

export interface SortableLayerListProps {
  mapId: string;
}

export const SortableLayerList = ({
  mapId,
}: SortableLayerListProps): React.ReactElement<SortableLayerListProps> => {
  const dispatch = useAppDispatch();
  const setLayerOrderByIds = (layerListIds: string[]) => {
    dispatch(actions.setLayerOrderByIds({ mapId, layerListIds }));
  };
  const layersInMap = useAppSelector((state: ViewerState): string[] =>
    selectors.getMapLayerIds(state, mapId),
  );
  return (
    <div
      style={{
        overflowY: 'scroll',
        width: 'inherit',
        height: '100%',
        background:
          'repeating-linear-gradient(-35deg,#D3CDE8,#D3CDE8 8px,#D1CBE6 8px, #D1CBE6 16px)',
      }}
    >
      <ReactSortable
        setList={(newList) => {
          if (layersInMap.join() === newList.map((it) => it.id).join()) {
            return;
          }
          setLayerOrderByIds(newList.map((it) => it.id));
        }}
        list={layersInMap.map((l) => {
          return { id: l };
        })}
      >
        {layersInMap.map((layerId, k): React.ReactElement => {
          return (
            <ReduxLayerComponent
              key={layerId}
              layerId={layerId}
              mapId={mapId}
              layerIndex={k}
            />
          );
        })}
      </ReactSortable>
    </div>
  );
};
