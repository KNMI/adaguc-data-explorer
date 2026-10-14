import * as React from 'react';
import {
  LayerProps,
  queryWMSLayers,
  queryWMSServiceInfo,
} from '@opengeoweb/webmap';
import {
  Box,
  Chip,
  IconButton,
  LinearProgress,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Skeleton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import ArrowForwardSharp from '@mui/icons-material/ArrowForwardSharp';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import DatasetIcon from '@mui/icons-material/Dataset';
import FolderIcon from '@mui/icons-material/Folder';
import InfoIcon from '@mui/icons-material/Info';
import RefreshIcon from '@mui/icons-material/Refresh';
import { alpha } from '@mui/material/styles';
import { CopyToClipBoard } from '../CopyToClipBoard';
import AutoWMSLayerDetailsDialog from './AutoWMSLayerDetailsDialog';
import { AdagucAutoWMSServiceCommand } from '../../store/types';
import { makeGoodServiceLink } from '../../utils/makeGoodServiceLink';

const PREVIEW_SIZE_PX = 140;

const AUTOWMS_INPUT_DEBOUNCE_MS = 600;
// Caps how many new preview images start loading per second, so opening a
// service with many layers doesn't fire off a burst of GetMap requests all
// at once.
const MAX_PREVIEW_IMAGES_PER_SECOND = 5;

interface AutoWMSResult {
  result: { path: string; name: string; leaf: boolean; adaguc?: string }[];
}

interface AutoWMSProps {
  addLayer: (service: string, name: string) => void;
  // Set when the top bar's "custom WMS service" field (see AdagucAppBar)
  // is given a url that looks like an AutoWMS explorer endpoint rather
  // than a plain OGC WMS one - opens it here instead of adding it as a
  // layer.
  // eslint-disable-next-line react/require-default-props
  externalServiceRequest?: AdagucAutoWMSServiceCommand;
}

const isWMSService = (service: string): boolean => {
  return service?.toLocaleLowerCase().indexOf('service=wms') > 0 || false;
};

const AutoWMS = ({
  addLayer,
  externalServiceRequest,
}: AutoWMSProps): React.ReactElement => {
  const lowerCaseUrlParams = new URLSearchParams(window.location.search);

  const serviceFromQueryString =
    lowerCaseUrlParams.get('autowms') || lowerCaseUrlParams.get('wmsservice');

  const [result, setResult] = React.useState<AutoWMSResult>({ result: [] });
  const [path, changePath] = React.useState<string>('');
  const [isLoading, setLoading] = React.useState<boolean>(false);
  const [currentLeaf, changeLeaf] = React.useState<string>('');
  const [layers, setLayers] = React.useState<LayerProps[]>([]);
  const [wmsAbstract, setWMSAbstract] = React.useState<string>('');
  const [detailsLayer, setDetailsLayer] = React.useState<LayerProps | null>(
    null,
  );

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

  // Commits a service immediately, bypassing the debounce below, so the
  // Enter key/Load button (and an externally requested service, see below)
  // always fetch right away instead of waiting out a keystroke debounce
  // meant for typing.
  const loadAutoWMSService = (service: string): void => {
    setLayers([]);
    setResult({ result: [] });
    changePath('');
    changeLeaf('');
    setOGCWMSService('');
    setAutoWMSServiceInput(service);
    setAutoWMSService(service);

    if (isWMSService(service)) {
      setOGCWMSService(service);
    }
  };

  const fetchNewAutoWMS = (): void => {
    loadAutoWMSService(autoWMSServiceInput);
  };

  // The top bar's "custom WMS service" field can send a service here (see
  // AdagucAppBar/SideToolPanel) instead of adding it as a layer, when it
  // looks like an AutoWMS explorer url - load it the same way Enter/Load
  // would.
  const lastAppliedExternalRequestId = React.useRef<number>(0);
  React.useEffect(() => {
    if (
      !externalServiceRequest ||
      externalServiceRequest.requestId === lastAppliedExternalRequestId.current
    ) {
      return;
    }
    lastAppliedExternalRequestId.current = externalServiceRequest.requestId;
    loadAutoWMSService(externalServiceRequest.service);
  }, [externalServiceRequest]);

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

  // Reveals (and so starts loading) at most MAX_PREVIEW_IMAGES_PER_SECOND
  // new preview images per second, instead of all of them as soon as the
  // layer list arrives.
  const [visiblePreviewCount, setVisiblePreviewCount] = React.useState(0);
  React.useEffect(() => {
    setVisiblePreviewCount(
      Math.min(MAX_PREVIEW_IMAGES_PER_SECOND, layers.length),
    );
    if (layers.length <= MAX_PREVIEW_IMAGES_PER_SECOND) {
      return undefined;
    }
    const intervalId = window.setInterval(() => {
      setVisiblePreviewCount((count) => {
        const next = Math.min(
          count + MAX_PREVIEW_IMAGES_PER_SECOND,
          layers.length,
        );
        if (next >= layers.length) {
          window.clearInterval(intervalId);
        }
        return next;
      });
    }, 1000);
    return () => window.clearInterval(intervalId);
  }, [layers]);

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
      <List dense disablePadding>
        {result?.result?.length === 0 && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ px: 2, py: 1.5 }}
          >
            No items found.
          </Typography>
        )}
        {result?.result?.map((p) => (
          <ListItemButton
            key={p.path + p.name}
            onClick={() => {
              if (p.leaf !== true) {
                changeLeaf('');
                changePath(p.path);
              } else {
                setOGCWMSService(p.adaguc);
                changeLeaf(p.path);
              }
            }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              {p.leaf ? (
                <DatasetIcon fontSize="small" color="action" />
              ) : (
                <FolderIcon fontSize="small" color="action" />
              )}
            </ListItemIcon>
            <ListItemText
              primary={p.name}
              primaryTypographyProps={{ variant: 'body2' }}
            />
          </ListItemButton>
        ))}
      </List>
    );

  const wmsLink = `${ogcWMSService}SERVICE=WMS&REQUEST=GetCapabilities`;
  const autowmsWMSServiceHeader = ogcWMSService?.length > 0 && (
    <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
      {wmsAbstract && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {wmsAbstract}
        </Typography>
      )}
      <Stack direction="row" spacing={0.5} alignItems="center">
        <Chip size="small" label="WMS" variant="outlined" />
        <CopyToClipBoard info="WMS Service link" text={wmsLink} />
        <Typography
          component="a"
          variant="body2"
          href={wmsLink}
          target="_blank"
          rel="noreferrer"
          sx={{ color: 'primary.main', wordBreak: 'break-all' }}
        >
          {wmsLink}
        </Typography>
      </Stack>
    </Box>
  );

  const autowmsWMSService = layers?.length > 0 && (
    <Stack spacing={1} sx={{ p: 1.5 }}>
      {layers.map((layer: LayerProps, i) => {
        const wmsImage = `${ogcWMSService}&LAYERS=${layer.name}&WIDTH=${
          PREVIEW_SIZE_PX * 2
        }&HEIGHT=${
          PREVIEW_SIZE_PX * 2
        }&SERVICE=WMS&request=GETMAP&format=image/webp&CRS=EPSG:4326`;
        return (
          <Paper
            key={wmsImage}
            variant="outlined"
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              p: 1,
              borderRadius: 2,
            }}
          >
            <Box
              onClick={() => {
                addLayer(ogcWMSService, layer.name);
              }}
              onKeyDown={() => {}}
              role="button"
              tabIndex={0}
              aria-label={`Add ${layer.title} to the map`}
              sx={{
                flexShrink: 0,
                width: PREVIEW_SIZE_PX,
                height: PREVIEW_SIZE_PX,
                borderRadius: 1.5,
                overflow: 'hidden',
                cursor: 'pointer',
                bgcolor: 'background.default',
              }}
            >
              {i < visiblePreviewCount ? (
                <img
                  src={wmsImage}
                  alt={layer.title}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                  }}
                />
              ) : (
                <Skeleton
                  variant="rectangular"
                  width={PREVIEW_SIZE_PX}
                  height={PREVIEW_SIZE_PX}
                />
              )}
            </Box>
            <Stack spacing={0.5} sx={{ minWidth: 0, flexGrow: 1 }}>
              <Typography variant="subtitle2" noWrap>
                {layer.title}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                noWrap
                sx={{ fontFamily: 'monospace' }}
              >
                {layer.name}
              </Typography>
            </Stack>
            <Tooltip title="Layer details">
              <IconButton
                size="small"
                aria-label="Layer details"
                onClick={() => {
                  setDetailsLayer(layer);
                }}
              >
                <InfoIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Paper>
        );
      })}
    </Stack>
  );

  return (
    <div className="autowms_app_container">
      <Paper sx={{ m: 1, p: 1.5, borderRadius: 2 }}>
        <Stack direction="row" spacing={1}>
          <TextField
            fullWidth
            size="small"
            label="Add AutoWMS or WMS service"
            variant="outlined"
            value={autoWMSServiceInput}
            sx={{ bgcolor: 'background.paper', borderRadius: 1 }}
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
              aria-label="Load service"
              onClick={() => {
                fetchNewAutoWMS();
              }}
            >
              <ArrowForwardSharp />
            </IconButton>
          </Tooltip>
        </Stack>
      </Paper>
      <Paper sx={{ mx: 1, mb: 1, borderRadius: 2, overflow: 'hidden' }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{
            px: 1.5,
            py: 1,
            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.12),
          }}
        >
          <Typography
            variant="body2"
            noWrap
            sx={{ fontFamily: 'monospace', minWidth: 0 }}
          >
            Current path: {path}
            {currentLeaf}
          </Typography>
          <Stack direction="row" spacing={0.5} flexShrink={0}>
            <Tooltip title="Up one level">
              <IconButton
                size="small"
                aria-label="Up one level"
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
              >
                <ArrowUpwardIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Refresh">
              <IconButton
                size="small"
                aria-label="Refresh"
                onClick={() => {
                  refresh();
                }}
              >
                <RefreshIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>
        {autowmsExplorerList}
        {autowmsWMSServiceHeader}
        {autowmsWMSService}
        {isLoading && <LinearProgress />}
      </Paper>
      <AutoWMSLayerDetailsDialog
        serviceUrl={ogcWMSService}
        layer={detailsLayer}
        onClose={() => {
          setDetailsLayer(null);
        }}
      />
    </div>
  );
};

export default AutoWMS;
