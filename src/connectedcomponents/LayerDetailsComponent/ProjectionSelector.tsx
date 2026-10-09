import React from 'react';
import { WMLayer } from '@opengeoweb/webmap';
import { actions, useAppDispatch, useAppSelector } from '../../store/store';
import { AdagucMapView, ViewerState } from '../../store/types';
import ProjectionNameMappings from './ProjectionNameMappings';

interface ProjectionSelectorProps {
  mapId: string;
  wmLayer: WMLayer;
}
const ProjectionSelector = ({
  mapId,
  wmLayer,
}: ProjectionSelectorProps): React.ReactElement => {
  const dispatch = useAppDispatch();
  const view = useAppSelector(
    (state: ViewerState): AdagucMapView => state?.viewer?.maps[mapId]?.view,
  );
  const currentSrs = view?.srs;

  const projectionItems = new Map<
    string,
    WMLayer['projectionProperties'][number]
  >();
  wmLayer?.projectionProperties.forEach((p) => {
    projectionItems.set(p.srs, p);
  });

  return (
    <table>
      <thead>
        <th style={{ width: '100px' }}>CRS</th>
        <th style={{ width: '350px' }}>Name</th>
        <th>Left</th>
        <th>Bottom</th>
        <th>Right</th>
        <th>Top</th>
      </thead>
      <tbody>
        {Array.from(projectionItems.values())
          .sort((a, b) => a.srs.localeCompare(b.srs))
          .map((p) => {
            return (
              <tr
                key={wmLayer.id + p.srs}
                className={currentSrs === p.srs ? 'selected' : ''}
                onClick={() => {
                  dispatch(
                    actions.requestSetProjection({
                      mapId,
                      srs: p.srs,
                      bbox: p.bbox,
                    }),
                  );
                }}
              >
                <td>{p.srs}</td>
                <td>{ProjectionNameMappings[p.srs] || '--'}</td>
                <td>{p.bbox.left}</td>
                <td>{p.bbox.bottom}</td>
                <td>{p.bbox.right}</td>
                <td>{p.bbox.top}</td>
              </tr>
            );
          })}
      </tbody>
    </table>
  );
};

export default ProjectionSelector;
