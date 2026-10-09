import * as React from 'react';
import {
  LayerProps,
  queryWMSLayers,
  queryWMSServiceInfo,
} from '@opengeoweb/webmap';
import { IconButton, LinearProgress, TextField, Tooltip } from '@mui/material';
import ArrowForwardSharp from '@mui/icons-material/ArrowForwardSharp';
import { CopyToClipBoard } from '../CopyToClipBoard';

const AUTOWMS_INPUT_DEBOUNCE_MS = 600;

interface AutoWMSResult {
  result: { path: string; name: string; leaf: boolean; adaguc?: string }[];
}

interface AutoWMSProps {
  addLayer: (service: string, name: string) => void;
}

const isWMSService = (service: string): boolean => {
  return service?.toLocaleLowerCase().indexOf('service=wms') > 0 || false;
};

const makeGoodServiceLink = (service: string): string => {
  if (service.indexOf('?') === -1) {
    return `${service}?`;
  }
  return service;
};

const AutoWMS = ({ addLayer }: AutoWMSProps): React.ReactElement => {
  const lowerCaseUrlParams = new URLSearchParams(window.location.search);

  const serviceFromQueryString =
    lowerCaseUrlParams.get('autowms') || lowerCaseUrlParams.get('wmsservice');

  const [result, setResult] = React.useState<AutoWMSResult>({ result: [] });
  const [path, changePath] = React.useState<string>('');
  const [isLoading, setLoading] = React.useState<boolean>(false);
  const [currentLeaf, changeLeaf] = React.useState<string>('');
  const [layers, setLayers] = React.useState<LayerProps[]>([]);
  const [wmsAbstract, setWMSAbstract] = React.useState<string>('');

  // What is currently typed in the text field, updated on every keystroke.
  const [autoWMSServiceInput, setAutoWMSServiceInput] = React.useState<string>(
    serviceFromQueryString || '',
  );
  // The committed service url that actually drives fetching the AutoWMS
  // explorer listing. Kept in sync with autoWMSServiceInput after a short
  // debounce while typing, or immediately on Enter/Load, so we don't fire a
  // request for every keystroke (and for every half-typed url/port).
  const [autoWMSService, setAutoWMSService] = React.useState<string>(
    serviceFromQueryString || '',
  );
  const [ogcWMSService, setOGCWMSService] = React.useState<string>(
    (isWMSService(serviceFromQueryString) && serviceFromQueryString) || '',
  );

  const handleError = (errorMessage: string): void => {
    // eslint-disable-next-line no-console
    console.error(errorMessage);
  };

  const fetchAutoWMSList = (): void => {
    if (isWMSService(autoWMSService)) {
      return;
    }
    if (autoWMSService.length < 4) {
      return;
    }
    setResult({ result: [] });
    const subquery = 'request=getfiles&path=';
    const url = makeGoodServiceLink(autoWMSService) + subquery + path;
    setLayers([]);
    setOGCWMSService('');
    setLoading(true);
    fetch(url)
      .then((a) => a.json())
      .then((b) => {
        setResult(b);
      })
      .catch((e) => {
        handleError(e);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const fetchLayersFromOGCWMSService = (): void => {
    if (ogcWMSService.length > 0) {
      const wmsLink = `${ogcWMSService}SERVICE=WMS&REQUEST=GetCapabilities`;
      setLayers([]);
      setLoading(true);
      Promise.all([queryWMSLayers(wmsLink, true), queryWMSServiceInfo(wmsLink)])
        .then(([_layers, serviceInfo]) => {
          setLoading(false);
          setLayers(_layers);
          setWMSAbstract(serviceInfo.abstract);
        })
        .catch((f) => {
          setLoading(false);
          handleError(f);
        });
    } else {
      setLayers([]);
    }
  };

  const refresh = (): void => {
    setLayers([]);
    setResult({ result: [] });
    window.setTimeout(() => {
      fetchAutoWMSList();
      fetchLayersFromOGCWMSService();
    }, 100);
  };

  const fetchNewAutoWMS = (): void => {
    setLayers([]);
    setResult({ result: [] });
    changePath('');
    changeLeaf('');
    setOGCWMSService('');
    // Commit the typed value immediately, bypassing the debounce below, so
    // Enter / the Load button always fetches right away.
    setAutoWMSService(autoWMSServiceInput);

    if (isWMSService(autoWMSServiceInput)) {
      setOGCWMSService(autoWMSServiceInput);
    }
  };

  // Debounce typing: only commit (and thus fetch) once the user pauses,
  // instead of on every keystroke.
  React.useEffect(() => {
    if (autoWMSServiceInput === autoWMSService) {
      return undefined;
    }
    const timeoutId = window.setTimeout(() => {
      setAutoWMSService(autoWMSServiceInput);
    }, AUTOWMS_INPUT_DEBOUNCE_MS);
    return () => window.clearTimeout(timeoutId);
  }, [autoWMSServiceInput]);

  React.useEffect(() => {
    fetchAutoWMSList();
  }, [path, autoWMSService]);

  React.useEffect(() => {
    fetchLayersFromOGCWMSService();
  }, [ogcWMSService]);

  React.useEffect(() => {
    // eslint-disable-next-line no-void
    void fetch('./config.json').then((r) => {
      r.json()
        .then((config) => {
          if (config && config.autowmsurl) {
            const service =
              serviceFromQueryString?.length > 0
                ? serviceFromQueryString
                : config.autowmsurl;
            setAutoWMSServiceInput(service);
            setAutoWMSService(service);
          }
        })
        .catch(() => {});
    });
  }, []);

  const autowmsExplorerList = currentLeaf.length === 0 &&
    layers?.length === 0 && (
      <div>
        {result?.result?.map((p, i) => {
          return (
            <div key={p.path + p.name}>
              <div
                className="autowms_app_fileitem"
                onClick={() => {
                  if (p.leaf !== true) {
                    changeLeaf('');
                    changePath(p.path);
                  } else {
                    setOGCWMSService(p.adaguc);
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

  const wmsLink = `${ogcWMSService}SERVICE=WMS&REQUEST=GetCapabilities`;
  const autowmsWMSServiceHeader = ogcWMSService?.length > 0 && (
    <div className="autowms_app_serviceabstract">
      Abstract: {wmsAbstract}
      <hr />
      WMS:
      <CopyToClipBoard info="WMS Service link" text={wmsLink} />
      <a target="_blank" rel="noreferrer" href={wmsLink}>
        {wmsLink}
      </a>
    </div>
  );

  const autowmsWMSService = layers?.length > 0 && (
    <div>
      {layers.map((layer: LayerProps, i) => {
        const wmsImage = `${ogcWMSService}&LAYERS=${layer.name}&WIDTH=400&HEIGHT=400&SERVICE=WMS&request=GETMAP&format=image/webp&CRS=EPSG:4326`;
        return (
          <div className="autowms_app_layeritem" key={wmsImage}>
            <span className="autowms_app_layeritem_text">
              {layer.title} - ({layer.name})
            </span>
            <span
              className="autowms_app_layeritem_image"
              onClick={() => {
                addLayer(ogcWMSService, layer.name);
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
        <div className="autowms_app_request_container">
          <TextField
            style={{ width: 'inherit', background: 'white' }}
            id="outlined-basic"
            label="Add AutoWMS or WMS service"
            variant="outlined"
            value={autoWMSServiceInput}
            onChange={(e) => {
              setAutoWMSServiceInput(e.target.value);
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                fetchNewAutoWMS();
              }
            }}
          />
          <Tooltip title="Load (you can also reference this via the ?autowms=<url> querystring in the browser location bar">
            <IconButton
              size="small"
              edge="end"
              color="inherit"
              aria-label="menu"
              onClick={() => {
                fetchNewAutoWMS();
              }}
            >
              <ArrowForwardSharp />
            </IconButton>
          </Tooltip>
        </div>
      </div>
      <div className="autowms_app_currentpath">
        Current path: {path}
        {currentLeaf}
      </div>
      <span className="autowms_app_fileitem_header">
        <span
          className="autowms_app_fileitem_return"
          onClick={() => {
            if (isWMSService(autoWMSService)) {
              refresh();
              return;
            }
            setLayers([]);
            setOGCWMSService('');
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
      {autowmsWMSServiceHeader}
      {autowmsWMSService}
      {isLoading && <LinearProgress />}
    </div>
  );
};

export default AutoWMS;
