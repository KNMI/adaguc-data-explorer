import * as React from 'react';
import DragBox from 'ol/interaction/DragBox';
import DragPan from 'ol/interaction/DragPan';
import { always } from 'ol/events/condition';
import { unByKey } from 'ol/Observable';
import { Bbox } from '@opengeoweb/webmap';
import { MapContext } from '@opengeoweb/webmap-react';

export interface OpenLayersHistogramBoxSelectPixelSize {
  width: number;
  height: number;
}

export interface OpenLayersHistogramBoxSelectProps {
  active: boolean;
  onBoxSelected: (
    bbox: Bbox,
    srs: string,
    pixelSize: OpenLayersHistogramBoxSelectPixelSize,
  ) => void;
}

// Lets the user drag a rectangle directly on the map - the same gesture
// adaguc-viewer's histogram tool reuses from its own "zoom to box" tool
// (gfiapp_histogram.js cancels the box's normal zoom and uses its bounds
// for a GetHistoGram request instead). The drawn box's extent, in the
// view's current srs, is handed back via onBoxSelected rather than
// actually zooming the map.
const OpenLayersHistogramBoxSelect = (
  props: OpenLayersHistogramBoxSelectProps,
): null => {
  const { active, onBoxSelected } = props;
  const { map } = React.useContext(MapContext);

  React.useEffect(() => {
    if (!map || !active) {
      return undefined;
    }

    // A plain drag would otherwise also pan the map underneath the box -
    // suspend panning for as long as box-select mode is active, restoring
    // it on cleanup (mode turned off, unmount, or the map itself changing).
    const dragPanInteractions = map
      .getInteractions()
      .getArray()
      .filter(
        (interaction): interaction is DragPan => interaction instanceof DragPan,
      );
    dragPanInteractions.forEach((interaction) => {
      interaction.setActive(false);
    });

    const dragBox = new DragBox({ condition: always });
    map.addInteraction(dragBox);
    const key = dragBox.on('boxend', () => {
      const extent = dragBox.getGeometry().getExtent();
      const srs = map.getView().getProjection().getCode();
      // Converting the extent's own corners (rather than deriving pixels
      // from the view's resolution) keeps this correct under rotation too.
      const pixel1 = map.getPixelFromCoordinate([extent[0], extent[1]]);
      const pixel2 = map.getPixelFromCoordinate([extent[2], extent[3]]);
      const width = Math.max(1, Math.round(Math.abs(pixel2[0] - pixel1[0])));
      const height = Math.max(1, Math.round(Math.abs(pixel2[1] - pixel1[1])));
      onBoxSelected(
        {
          left: extent[0],
          bottom: extent[1],
          right: extent[2],
          top: extent[3],
        },
        srs,
        { width, height },
      );
    });

    return () => {
      unByKey(key);
      map.removeInteraction(dragBox);
      dragPanInteractions.forEach((interaction) => {
        interaction.setActive(true);
      });
    };
  }, [map, active, onBoxSelected]);

  return null;
};

export default OpenLayersHistogramBoxSelect;
