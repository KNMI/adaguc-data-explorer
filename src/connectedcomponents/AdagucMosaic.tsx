import * as React from 'react';
import { Mosaic, MosaicNode } from 'react-mosaic-component';

export interface AdagucMosaicProps {
  mosaicItems: { [viewId: string]: React.ReactElement };
  collapseAutoWMS: boolean;
}
export const AdagucMosaic = ({
  mosaicItems,
  collapseAutoWMS,
}: AdagucMosaicProps): React.ReactElement<AdagucMosaicProps> => {
  const screenWidth = Math.max(
    document.documentElement.clientWidth || 0,
    window.innerWidth || 0,
  );

  // Wide enough that the footer icon row (now 8 icons, including the two
  // move-up/move-down buttons) still leaves the opacity slider between
  // them some real room, instead of squeezing it down to a sliver.
  const layerPanelWidth = 494; // 380 * 1.3
  const rightPanelWidth = 500;

  const leftPanelWidthPercentage = (layerPanelWidth / screenWidth) * 100;
  const autoWMSPanelWidthPercentage =
    100 - (rightPanelWidth / (screenWidth - layerPanelWidth)) * 100;
  const autoWMSPanelWidthPercentageCollapsed =
    100 - (30 / (screenWidth - layerPanelWidth)) * 100;

  return React.useMemo(() => {
    const autoWMSSplitPercentage = collapseAutoWMS
      ? autoWMSPanelWidthPercentage
      : autoWMSPanelWidthPercentageCollapsed;
    // Used to nest this under an extra, always-empty 'a' pane (0% height)
    // in a column split - react-mosaic-component still renders that
    // split's resize handle even at 0%, showing up as a thin gray bar
    // between the top bar and the map. With nothing ever shown there,
    // this is the mosaic's root directly instead.
    const initialValue: MosaicNode<string> = {
      type: 'split',
      direction: 'row',
      splitPercentages: [
        leftPanelWidthPercentage,
        100 - leftPanelWidthPercentage,
      ],
      children: [
        'b',
        {
          type: 'split',
          direction: 'row',
          splitPercentages: [
            autoWMSSplitPercentage,
            100 - autoWMSSplitPercentage,
          ],
          children: ['c', 'd'],
        },
      ],
    };
    return (
      <Mosaic<string>
        renderTile={(id) => {
          return mosaicItems[id];
        }}
        initialValue={initialValue}
      />
    );
  }, [collapseAutoWMS]);
};
