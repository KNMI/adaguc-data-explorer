import * as React from 'react';
import { Mosaic } from 'react-mosaic-component';

export interface AdagucMosaicProps {
  mosaicItems: { [viewId: string]: JSX.Element };
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
    return (
      <Mosaic<string>
        renderTile={(id) => {
          return mosaicItems[id];
        }}
        initialValue={{
          direction: 'column',
          first: 'a',
          second: {
            direction: 'row',
            first: 'b',
            second: {
              direction: 'row',
              first: 'c',
              second: 'd',
              splitPercentage: collapseAutoWMS
                ? autoWMSPanelWidthPercentage
                : autoWMSPanelWidthPercentageCollapsed,
            },
            splitPercentage: leftPanelWidthPercentage,
          },
          splitPercentage: 0,
        }}
      />
    );
  }, [collapseAutoWMS]);
};
