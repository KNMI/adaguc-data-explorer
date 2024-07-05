import * as React from 'react';
import { LayerProps, WMGetServiceFromStore } from '@opengeoweb/webmap';

interface AutoWMSResult {
  result: { path: string; name: string; leaf: boolean; adaguc?: string }[];
}

interface AutoWMSProps {
  addLayer: (service: string, name: string) => void;
}

const AutoWMS = ({ addLayer }: AutoWMSProps): React.ReactElement => {
  const [result, setResult] = React.useState<AutoWMSResult>({ result: [] });
  const [path, changePath] = React.useState<string>('');
  const [currentLeaf, changeLeaf] = React.useState<string>('');
  const [serviceToDisplay, setServiceToDisplay] = React.useState<string>('');
  const [layers, setLayers] = React.useState<LayerProps[]>([]);
  const service = 'https://plieger-precision-5680//autowms?';
  const subquery = 'request=getfiles&path=';

  const handleError = (errorMessage: string): void => {
    // eslint-disable-next-line no-console
    console.error(errorMessage);
  };

  const fetchList = (): void => {
    const url = service + subquery + path;
    setResult({ result: [] });
    fetch(url)
      .then((a) => a.json())
      .then((b) => {
        setResult(b);
      })
      .catch((e) => {
        handleError(e);
      });
  };

  const fetchWMSService = (): void => {
    setLayers([]);
    if (serviceToDisplay.length > 0) {
      const wmsLink = `${serviceToDisplay}SERVICE=WMS&REQUEST=GetCapabilities`;

      WMGetServiceFromStore(wmsLink).getLayerObjectsFlat(
        (_layers) => {
          setLayers(_layers);
        },
        (f) => {
          handleError(f);
        },
        true,
      );
    } else {
      setLayers([]);
    }
  };

  React.useEffect(() => {
    fetchList();
  }, [path]);

  React.useEffect(() => {
    fetchWMSService();
  }, [serviceToDisplay]);

  const refresh = (): void => {
    setLayers([]);
    setResult({ result: [] });
    window.setTimeout(() => {
      fetchList();
      fetchWMSService();
    }, 100);
  };

  const autowmsExplorerList = currentLeaf.length === 0 && (
    <div>
      {result.result.map((p, i) => {
        return (
          <div key={p.path + p.name}>
            <div
              className="autowms_app_fileitem"
              onClick={() => {
                if (p.leaf !== true) {
                  changeLeaf('');
                  changePath(p.path);
                } else {
                  setServiceToDisplay(p.adaguc);
                  changeLeaf(p.path);
                }
              }}
              onKeyDown={() => {}}
              role="button"
              tabIndex={i}
            >
              <span>{p.leaf ? '🗃' : '📁'}&nbsp;</span>
              <span>{p.name}</span>
            </div>
          </div>
        );
      })}
    </div>
  );

  const wmsLink = `${serviceToDisplay}SERVICE=WMS&REQUEST=GetCapabilities`;
  const autowmsExplorerService = currentLeaf.length > 0 && (
    <div>
      <div className="autowms_app_serviceabstract">
        WMS{' '}
        <a target="_blank" rel="noreferrer" href={wmsLink}>
          {wmsLink}
        </a>
      </div>
      {layers.map((layer: LayerProps, i) => {
        const wmsImage = `${serviceToDisplay}LAYERS=${layer.name}&WIDTH=400&HEIGHT=400&SERVICE=WMS&request=GETMAP&format=image/webp&CRS=EPSG:4326`;
        return (
          <div className="autowms_app_layeritem" key={wmsImage}>
            <span className="autowms_app_layeritem_text">
              {layer.title} - ({layer.name})
            </span>
            <span
              className="autowms_app_layeritem_image"
              onClick={() => {
                addLayer(serviceToDisplay, layer.name);
              }}
              onKeyDown={() => {}}
              role="button"
              tabIndex={i + 1000}
            >
              <img src={wmsImage} alt={layer.title} />
            </span>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="autowms_app_container">
      <div className="autowms_app_currentpath">
        Current path: {path}
        {currentLeaf}
      </div>
      <span className="autowms_app_fileitem_header">
        <span
          className="autowms_app_fileitem_return"
          onClick={() => {
            if (currentLeaf.length > 0) {
              changeLeaf('');
            } else {
              const pathItems = path.split('/');
              if (pathItems.length > 1) {
                pathItems.pop();
                changePath(pathItems.join('/'));
              } else {
                changePath('');
              }
            }
          }}
          onKeyDown={() => {}}
          role="button"
          tabIndex={0}
        >
          📁&nbsp;<b>../ (⇧)</b>
        </span>
        <span
          className="autowms_app_fileitem_refresh"
          onClick={() => {
            refresh();
          }}
          onKeyDown={() => {}}
          role="button"
          tabIndex={0}
        >
          ↻&nbsp;<b>Refresh</b>
        </span>
      </span>
      {autowmsExplorerList}
      {autowmsExplorerService}
    </div>
  );
};

export default AutoWMS;
