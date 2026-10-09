/* eslint-disable @typescript-eslint/no-floating-promises */
import * as React from 'react';

import { MapLocation } from '@opengeoweb/webmap-react';
import 'react-mosaic-component/react-mosaic-component.css';
import '../../assets/styles.css';
import { actions, useAppDispatch, useAppSelector } from '../../store/store';
import { selectors } from '../../store/selectors';
import { AdagucLayer, ViewerState } from '../../store/types';
import { getFeatureInfoUrl } from '../../utils/getFeatureInfoUrl';
import sanitizeHTML from '../../utils/sanitizeHTML';

export interface GetFeatureInfoPanelProps {
  mapId: string;
  active: boolean;
}
const GetFeatureInfoPanel = ({
  mapId,
  active,
}: GetFeatureInfoPanelProps): React.ReactElement => {
  const dispatch = useAppDispatch();
  const results = React.useRef(new Map<string, string>()).current;

  const [, setCount] = React.useState(0);

  const layers = useAppSelector((state: ViewerState): AdagucLayer[] =>
    selectors.getMapLayers(state, mapId),
  );
  const mapPinLocation = useAppSelector(
    (state: ViewerState): MapLocation =>
      state?.viewer?.maps[mapId]?.mapPinLocation,
  );

  React.useEffect(() => {
    dispatch(actions.setGetFeatureInfoActive({ mapId, active }));
  }, [mapId, active, dispatch]);

  React.useEffect(() => {
    if (!active || !mapPinLocation) {
      return;
    }
    results.clear();
    layers
      .filter((layer) => layer.enabled)
      .forEach((layer) => {
        const url = getFeatureInfoUrl(layer, mapPinLocation);
        if (!url) {
          return;
        }
        const gfilinks = results;
        fetch(url)
          .then((r) => {
            r.text().then((t) => {
              gfilinks.set(layer.id, t);
              setCount(Math.random());
            });
          })
          .catch((e) => {
            // eslint-disable-next-line no-console
            console.error(e);
          });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, mapPinLocation, layers]);

  return (
    <div>
      GetFeatureInfo: Click on the map
      <div>
        {layers
          .filter((layer) => layer.enabled)
          .map((layer) => {
            const url =
              mapPinLocation && getFeatureInfoUrl(layer, mapPinLocation);
            return (
              <div key={layer.id} className="getfeatureinfo_result">
                <div className="getfeatureinfo_result_header">
                  Info for layer <code>{layer.name}</code>
                  {url && (
                    <a target="_blank" rel="noreferrer" href={url}>
                      - &#x29c9;
                    </a>
                  )}
                </div>
                <div
                  className="getfeatureinfo_result_contents"
                  // eslint-disable-next-line react/no-danger
                  dangerouslySetInnerHTML={sanitizeHTML(
                    results.get(layer.id) || '--',
                  )}
                />
              </div>
            );
          })}
      </div>
    </div>
  );
};

export default GetFeatureInfoPanel;
