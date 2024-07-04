import * as React from 'react';
import { Mosaic } from 'react-mosaic-component';

export interface AdagucMosaicProps {
  mosaicItems: { [viewId: string]: JSX.Element };
}
export const AdagucMosaic = ({
  mosaicItems,
}: AdagucMosaicProps): React.ReactElement<AdagucMosaicProps> => {
  const screenWidth = window.screen.width;
  const layerListWidth = 300;

  const leftPanelWidthPercentage = (350 / screenWidth) * 100;

  return React.useMemo(() => {
    return (
      <Mosaic<string>
        renderTile={(id) => mosaicItems[id]}
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
              splitPercentage: 99,
            },
            splitPercentage: leftPanelWidthPercentage,
          },
          splitPercentage: 0,
        }}
      />
    );
  }, []);
};
