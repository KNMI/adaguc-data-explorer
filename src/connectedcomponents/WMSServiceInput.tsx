/* eslint-disable react/jsx-props-no-spreading */
import * as React from 'react';
import { Autocomplete, IconButton, TextField } from '@mui/material';
import type { SxProps, Theme } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { actions, useAppDispatch } from '../store/store';
import { thunks } from '../store/thunks';

const RECENT_SERVICES_KEY = 'adaguc_recent_wms_services';
const MAX_RECENT_SERVICES = 30;

// localStorage may be disabled (private browsing) or the value corrupted -
// either way, the recent-services list is a convenience, not something
// worth failing the input over.
const getRecentServices = (): string[] => {
  try {
    const raw = window.localStorage.getItem(RECENT_SERVICES_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed.filter((entry): entry is string => typeof entry === 'string')
      : [];
  } catch {
    return [];
  }
};

const rememberRecentService = (service: string): string[] => {
  const updated = [
    service,
    ...getRecentServices().filter((entry) => entry !== service),
  ].slice(0, MAX_RECENT_SERVICES);
  try {
    window.localStorage.setItem(RECENT_SERVICES_KEY, JSON.stringify(updated));
  } catch {
    // Storage may be disabled/full - history is a convenience, not
    // something worth failing the input over.
  }
  return updated;
};

const forgetRecentService = (service: string): string[] => {
  const updated = getRecentServices().filter((entry) => entry !== service);
  try {
    window.localStorage.setItem(RECENT_SERVICES_KEY, JSON.stringify(updated));
  } catch {
    // Storage may be disabled/full - history is a convenience, not
    // something worth failing the input over.
  }
  return updated;
};

// AutoWMS explorer endpoints (see AutoWMS.tsx) are plain file-listing
// services, not OGC WMS ones - a url naming "autowms" always opens the
// AutoWMS panel, and one with service=wms is always added as a map layer.
const isAutoWMSServiceUrl = (url: string): boolean => /autowms/i.test(url);
const isOGCWMSServiceUrl = (url: string): boolean =>
  url.toLocaleLowerCase().includes('service=wms');

const makeGoodServiceLink = (service: string): string =>
  service.indexOf('?') === -1 ? `${service}?` : service;

// A common slip is typing the AutoWMS server's url without the "autowms"
// path segment it actually serves from (e.g. "https://host/" instead of
// "https://host/autowms") - guess that corrected url rather than probing
// the one actually typed.
const guessAutoWMSUrl = (url: string): string =>
  `${url.endsWith('/') ? url : `${url}/`}autowms`;

// Neither a service=wms url nor one already naming "autowms" - rather
// than assume, try the likely AutoWMS url (see guessAutoWMSUrl) once, and
// only fall back to adding the originally typed url as a WMS layer if
// that doesn't look like valid AutoWMS explorer data.
const probeAutoWMSUrl = (url: string): Promise<string | undefined> => {
  const candidate = guessAutoWMSUrl(url);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return fetch(`${makeGoodServiceLink(candidate)}request=getfiles&path=`)
    .then((response) => response.json() as Promise<{ result?: unknown[] }>)
    .then((json) => (Array.isArray(json?.result) ? candidate : undefined))
    .catch(() => undefined);
};

export interface WMSServiceInputProps {
  // eslint-disable-next-line react/require-default-props
  placeholder?: string;
  // eslint-disable-next-line react/require-default-props
  sx?: SxProps<Theme>;
  // Called once the entered service has been successfully routed (added
  // as a layer, or opened in the AutoWMS panel) - lets a caller showing
  // this inside a dialog close it, for instance.
  // eslint-disable-next-line react/require-default-props
  onHandled?: () => void;
}

// A single "add a WMS or AutoWMS service" field, reused by both the top
// bar (AdagucAppBar) and the "Add data" dialog (AddDataComponent), so both
// get the same WMS/AutoWMS routing and recent-services history.
const WMSServiceInput = ({
  placeholder = 'Add a custom WMS or AutoWMS service',
  sx,
  onHandled,
}: WMSServiceInputProps): React.ReactElement => {
  const dispatch = useAppDispatch();
  const mapId = 'map1';

  const [value, setValue] = React.useState<string>('');
  const [recentServices, setRecentServices] = React.useState<string[]>(() =>
    getRecentServices(),
  );

  const handleForgetRecentService = (service: string): void => {
    setRecentServices(forgetRecentService(service));
  };

  const submitService = (service: string): void => {
    if (!service) {
      return;
    }
    const finish = (): void => {
      setRecentServices(rememberRecentService(service));
      setValue('');
      onHandled?.();
    };
    const addAsLayer = (): Promise<void> =>
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      dispatch(thunks.addLayer({ mapId, serviceUrl: service, name: undefined }))
        .unwrap()
        .then(finish);

    if (isAutoWMSServiceUrl(service)) {
      dispatch(actions.requestAutoWMSService({ service }));
      finish();
      return;
    }
    if (isOGCWMSServiceUrl(service)) {
      addAsLayer().catch((e: unknown) => {
        // eslint-disable-next-line no-console
        console.warn(e);
      });
      return;
    }

    probeAutoWMSUrl(service)
      .then((autoWMSUrl) => {
        if (autoWMSUrl) {
          dispatch(actions.requestAutoWMSService({ service: autoWMSUrl }));
          finish();
          return undefined;
        }
        return addAsLayer();
      })
      .catch((e: unknown) => {
        // eslint-disable-next-line no-console
        console.warn(e);
      });
  };

  return (
    <Autocomplete
      freeSolo
      openOnFocus
      options={recentServices}
      inputValue={value}
      onInputChange={(_event, newValue) => {
        setValue(newValue);
      }}
      // freeSolo's onChange already fires with the typed value on Enter,
      // the same as it does when an option is clicked - a separate
      // keydown handler here would submit it a second time.
      onChange={(_event, newValue) => {
        if (typeof newValue === 'string' && newValue) {
          submitService(newValue);
        }
      }}
      sx={sx}
      renderOption={(optionProps, option) => {
        // MUI puts `key` in optionProps - spreading it alongside an
        // explicit `key` prop below would warn, so it's pulled out here.
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
            <IconButton
              size="small"
              aria-label={`Remove ${option} from recent services`}
              // The listbox selects an option on mousedown, before the
              // click this is actually waiting for ever fires - without
              // stopping it here too, clicking this button would select
              // (and submit) the option it's meant to delete instead.
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
          </li>
        );
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder={placeholder}
          variant="outlined"
          size="small"
        />
      )}
    />
  );
};

export default WMSServiceInput;
