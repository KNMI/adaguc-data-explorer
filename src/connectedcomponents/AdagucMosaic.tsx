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

  const layerPanelWidth = 300;
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
    const initialValue: MosaicNode<string> = {
      type: 'split',
      direction: 'column',
      splitPercentages: [0, 100],
      children: [
        'a',
        {
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
