import * as React from 'react';
import { Mosaic } from 'react-mosaic-component';

export interface AdagucMosaicProps {
  mosaicItems: { [viewId: string]: JSX.Element };
}
export const AdagucMosaic = ({
  mosaicItems,
}: AdagucMosaicProps): React.ReactElement<AdagucMosaicProps> => {
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
              splitPercentage: 80,
            },
            splitPercentage: 30,
          },
          splitPercentage: 0,
        }}
      />
    );
  }, []);
};
