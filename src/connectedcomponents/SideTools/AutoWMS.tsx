/* eslint-disable react/jsx-props-no-spreading */
import * as React from 'react';
import {
  LayerProps,
  queryWMSLayers,
  queryWMSServiceInfo,
} from '@opengeoweb/webmap';
import {
  Autocomplete,
  Box,
  Chip,
  IconButton,
  InputAdornment,
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
import DeleteIcon from '@mui/icons-material/Delete';
import FolderIcon from '@mui/icons-material/Folder';
import InfoIcon from '@mui/icons-material/Info';
import ClearIcon from '@mui/icons-material/Clear';
import RefreshIcon from '@mui/icons-material/Refresh';
import { alpha } from '@mui/material/styles';
import { CopyToClipBoard } from '../CopyToClipBoard';
import AutoWMSLayerDetailsDialog from './AutoWMSLayerDetailsDialog';
import { AdagucAutoWMSServiceCommand } from '../../store/types';
import { makeGoodServiceLink } from '../../utils/makeGoodServiceLink';
import {
  forgetRecentService,
  getRecentServices,
  rememberRecentService,
} from '../../utils/recentServices';
import { fetchDefaultAutoWMSService } from '../../utils/defaultAutoWMSService';

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
  const [layerFilter, setLayerFilter] = React.useState<string>('');
  const [detailsLayer, setDetailsLayer] = React.useState<LayerProps | null>(
    null,
  );
  // Shared with WMSServiceInput (top bar / "Add data" dialog) via the same
  // localStorage-backed history, so a url typed in either place shows up
  // as a suggestion in both.
  const [recentServices, setRecentServices] = React.useState<string[]>(() =>
    getRecentServices(),
  );
  const [defaultAutoWMSService, setDefaultAutoWMSService] = React.useState<
    string | undefined
  >();
  const handleForgetRecentService = (service: string): void => {
    setRecentServices(forgetRecentService(service));
  };

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

  // Guards against a stale GetCapabilities response: if the service
  // changes (or clears) again before an earlier fetch resolves, that
  // fetch's result must not overwrite the newer state - otherwise
  // `layers` can end up populated from an old service while
  // `ogcWMSService` is already empty/different, and each layer's preview
  // image url (built as `${ogcWMSService}&LAYERS=...`) collapses to a bare
  // "&LAYERS=..." the browser then resolves against the current page.
  const ogcServiceRequestIdRef = React.useRef(0);

  const fetchLayersFromOGCWMSService = (): void => {
    ogcServiceRequestIdRef.current += 1;
    const requestId = ogcServiceRequestIdRef.current;
    if (ogcWMSService.length > 0) {
      const wmsLink = `${ogcWMSService}SERVICE=WMS&REQUEST=GetCapabilities`;
      setLayers([]);
      setLoading(true);
      Promise.all([queryWMSLayers(wmsLink, true), queryWMSServiceInfo(wmsLink)])
        .then(([_layers, serviceInfo]) => {
          if (ogcServiceRequestIdRef.current !== requestId) {
            return;
          }
          setLoading(false);
          setLayers(_layers);
          setWMSAbstract(serviceInfo.abstract);
        })
        .catch((f) => {
          if (ogcServiceRequestIdRef.current !== requestId) {
            return;
          }
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
    if (service) {
      setRecentServices(rememberRecentService(service));
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
    // A filter left over from a previous service would otherwise silently
    // hide every layer of the newly loaded one.
    setLayerFilter('');
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
    void fetchDefaultAutoWMSService().then((defaultService) => {
      if (!defaultService) {
        return;
      }
      setDefaultAutoWMSService(defaultService);
      const service =
        serviceFromQueryString?.length > 0
          ? serviceFromQueryString
          : defaultService;
      setAutoWMSServiceInput(service);
      setAutoWMSService(service);
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

  // Many services (e.g. SAT) list hundreds of layers - matching against
  // both title and name covers both "Temperature 2m" (title) and
  // "temperature-2m" (name) style searches. Split into words and require
  // each one to appear SOMEWHERE in the title/name (not the whole query as
  // one literal substring), so "air press sea" finds "Air Pressure at Mean
  // Sea Level" even though "press sea" never appears contiguously in that
  // title. Keeping each entry's original index (rather than the
  // post-filter one) means the progressive-preview-reveal effect below -
  // which only ever counts up against the full, unfiltered list - still
  // lines up with which images have actually started loading.
  const filterTokens = layerFilter
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
  const filteredLayers = layers
    .map((layer, originalIndex) => ({ layer, originalIndex }))
    .filter(({ layer }) => {
      if (filterTokens.length === 0) {
        return true;
      }
      const searchableText =
        `${layer.title ?? ''} ${layer.name ?? ''}`.toLowerCase();
      return filterTokens.every((token) => searchableText.includes(token));
    });

  const layerFilterBox = layers?.length > 0 && (
    <Box sx={{ px: 1.5, pt: 1.5 }}>
      <TextField
        fullWidth
        size="small"
        label="Filter layers"
        placeholder="e.g. temperature"
        variant="outlined"
        value={layerFilter}
        onChange={(e) => {
          setLayerFilter(e.target.value);
        }}
        InputProps={{
          endAdornment: layerFilter.length > 0 && (
            <InputAdornment position="end">
              <IconButton
                size="small"
                aria-label="Clear filter"
                onClick={() => {
                  setLayerFilter('');
                }}
              >
                <ClearIcon fontSize="small" />
              </IconButton>
            </InputAdornment>
          ),
        }}
      />
    </Box>
  );

  const autowmsWMSService = layers?.length > 0 && (
    <Stack spacing={1} sx={{ p: 1.5 }}>
      {filteredLayers.length === 0 && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ px: 0.5, py: 1 }}
        >
          No layers match &quot;{layerFilter}&quot;.
        </Typography>
      )}
      {filteredLayers.map(({ layer, originalIndex }) => {
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
              {originalIndex < visiblePreviewCount ? (
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

  // The deployment's own default AutoWMS endpoint is always one click away
  // here, pinned first, rather than only suggested once it happens to
  // already be in the (locally-stored) recent-services history.
  const autoWMSOptions = defaultAutoWMSService
    ? [
        defaultAutoWMSService,
        ...recentServices.filter(
          (service) => service !== defaultAutoWMSService,
        ),
      ]
    : recentServices;

  return (
    <div className="autowms_app_container">
      <Paper sx={{ m: 1, p: 1.5, borderRadius: 2 }}>
        <Stack direction="row" spacing={1}>
          <Autocomplete
            fullWidth
            freeSolo
            openOnFocus
            options={autoWMSOptions}
            inputValue={autoWMSServiceInput}
            onInputChange={(_event, newValue) => {
              setAutoWMSServiceInput(newValue);
            }}
            // freeSolo's onChange already fires with the typed value on
            // Enter, the same as it does when an option is clicked - a
            // separate keydown handler here would load it a second time.
            onChange={(_event, newValue) => {
              if (typeof newValue === 'string' && newValue) {
                loadAutoWMSService(newValue);
              }
            }}
            sx={{ bgcolor: 'background.paper', borderRadius: 1 }}
            renderOption={(optionProps, option) => {
              // MUI puts `key` in optionProps - spreading it alongside an
              // explicit `key` prop below would warn, so it's pulled out
              // here.
              const { key, ...rest } = optionProps;
              return (
                <li
                  key={key}
                  {...rest}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span
                    style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {option}
                  </span>
                  {option !== defaultAutoWMSService && (
                    <IconButton
                      size="small"
                      aria-label={`Remove ${option} from recent services`}
                      // The listbox selects an option on mousedown, before
                      // the click this is actually waiting for ever fires -
                      // without stopping it here too, clicking this button
                      // would select (and load) the option it's meant to
                      // delete instead.
                      onMouseDown={(event) => {
                        event.stopPropagation();
                      }}
                      onClick={(event) => {
                        event.stopPropagation();
                        handleForgetRecentService(option);
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  )}
                </li>
              );
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                size="small"
                label="Add AutoWMS or WMS service"
                variant="outlined"
              />
            )}
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
            {/* currentLeaf (like path) is always a full path from the
                root, not a bare filename to append to path - showing both
                together would double up the parent segments. */}
            Current path: {currentLeaf || path}
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
        {layerFilterBox}
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
