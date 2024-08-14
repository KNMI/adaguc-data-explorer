/* eslint-disable @typescript-eslint/no-floating-promises */
import * as React from 'react';

import { getWMJSMapById } from '@opengeoweb/webmap';
import { MapLocation } from '@opengeoweb/webmap-react';
import 'react-mosaic-component/react-mosaic-component.css';
import '../../assets/styles.css';
import sanitizeHTML from '../../utils/sanitizeHTML';

export interface GetFeatureInfoPanelProps {
  mapId: string;
  active: boolean;
}
const GetFeatureInfoPanel = ({
  mapId,
  active,
}: GetFeatureInfoPanelProps): React.ReactElement => {
  const results = React.useRef(new Map<string, string>()).current;
  const gfilinks = React.useRef(new Map<string, string>()).current;

  const [, setCount] = React.useState(0);

  React.useEffect(() => {
    const handleOnSetMapPinEffect = (mapPinLatLonCoordinate: MapLocation) => {
      if (!active) {
        return;
      }

      getWMJSMapById(mapId)?.getMapPin().showMapPin();
      getWMJSMapById(mapId)?.getMapPin().positionMapPinByLatLon({
        x: mapPinLatLonCoordinate.lon,
        y: mapPinLatLonCoordinate.lat,
      });
      getWMJSMapById(mapId)?.draw();
      const mouse = getWMJSMapById(mapId)?.getMapPin().getXY();

      getWMJSMapById(mapId)
        ?.getLayers()
        .forEach((layer) => {
          const url = getWMJSMapById(mapId)?.getWMSGetFeatureInfoRequestURL(
            layer,
            mouse.x,
            mouse.y,
            'text/html',
          );
          gfilinks.set(layer.id, url);
          fetch(url)
            .then((r) => {
              r.text().then((t) => {
                results.set(layer.id, t);
                setCount(Math.random());
              });
            })
            .catch((e) => {
              // eslint-disable-next-line no-console
              console.error(e);
            });
        });
    };

    getWMJSMapById(mapId)?.addListener(
      'onsetmappin',
      handleOnSetMapPinEffect,
      true,
    );
    return () => {
      getWMJSMapById(mapId)?.removeListener(
        'onsetmappin',
        handleOnSetMapPinEffect,
      );

      getWMJSMapById(mapId)?.getMapPin().hideMapPin();
    };
  }, [active]);

  return (
    <div>
      GetFeatureInfo: Click on the map
      <div>
        {getWMJSMapById(mapId)
          ?.getLayers()
          .map((layer) => {
            const link = gfilinks.get(layer.id) || '';
            return (
              <div key={layer.id} className="getfeatureinfo_result">
                <div className="getfeatureinfo_result_header">
                  Info for layer <code>{layer.name}</code> /{' '}
                  <i>{layer.title}</i>
                  {link && (
                    <a target="_blank" rel="noreferrer" href={link}>
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
