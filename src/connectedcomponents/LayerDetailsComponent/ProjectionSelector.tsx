import React from 'react';
import { WMLayer } from '@opengeoweb/webmap';
import WMProjection from '@opengeoweb/webmap/src/lib/components/WMProjection';
import ProjectionNameMappings from './ProjectionNameMappings';

interface ProjectionSelectorProps {
  wmLayer: WMLayer;
}
const ProjectionSelector = ({
  wmLayer,
}: ProjectionSelectorProps): React.ReactElement => {
  const [currentSrs, setSrs] = React.useState<string>(
    wmLayer.parentMap.getProjection().srs,
  );

  const projectionItems = new Map<string, WMProjection>();
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
                  wmLayer.parentMap.setProjection(p.srs, p.bbox);
                  wmLayer.parentMap.draw();
                  setSrs(p.srs);
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
