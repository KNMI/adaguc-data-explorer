// Shared "recently used service url" history, backed by localStorage -
// used by both WMSServiceInput (top bar / "Add data" dialog) and AutoWMS's
// own service field, so typing a url in either place makes it show up as
// a suggestion in the other too.
const RECENT_SERVICES_KEY = 'adaguc_recent_wms_services';
const MAX_RECENT_SERVICES = 30;

// localStorage may be disabled (private browsing) or the value corrupted -
// either way, the recent-services list is a convenience, not something
// worth failing the input over.
export const getRecentServices = (): string[] => {
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

export const rememberRecentService = (service: string): string[] => {
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

export const forgetRecentService = (service: string): string[] => {
  const updated = getRecentServices().filter((entry) => entry !== service);
  try {
    window.localStorage.setItem(RECENT_SERVICES_KEY, JSON.stringify(updated));
  } catch {
    // Storage may be disabled/full - history is a convenience, not
    // something worth failing the input over.
  }
  return updated;
};
