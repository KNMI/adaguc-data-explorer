import { AppThunkDispatch } from '../store/store';
import { thunks } from '../store/thunks';
import { AdagucLayer } from '../store/types';

export interface ParsedAddLayerHash {
  serviceUrl: string;
  name: string;
}

// Mirrors adaguc-viewer's own addlayer('<service>','<name>') hash command
// (webmapjsext/WMJSExtMain.js's hashTagHasChanged - matched there with
// indexOf/substring rather than a regex, but the same syntax). Firefox
// auto-encodes the quotes to %27 in location.hash, so that gets
// un-escaped first, the same way adaguc-viewer's own hash poller does.
const ADD_LAYER_HASH_PATTERN = /^#?addlayer\('([^']*)',\s*'([^']*)'\)$/;

export const parseAddLayerHash = (hash: string): ParsedAddLayerHash | null => {
  const unescaped = hash.replace(/%27/g, "'");
  const match = ADD_LAYER_HASH_PATTERN.exec(unescaped);
  if (!match) {
    return null;
  }
  const [, serviceUrl, name] = match;
  if (!serviceUrl || !name) {
    return null;
  }
  return { serviceUrl, name };
};

// Setting window.location.hash never reloads the page, so an already-open
// tab only picks this up live if something calls this again on every
// 'hashchange' - unlike handleWindowLocationQueryString's ?query=
// permalink restore, which only ever needs to run once on mount.
export const handleAddLayerHash = (
  mapId: string,
  dispatch: AppThunkDispatch,
  existingLayers: AdagucLayer[],
): void => {
  const parsed = parseAddLayerHash(window.location.hash);
  if (!parsed) {
    return;
  }
  // The command has been read - clear it from the url so it doesn't stay
  // there once handled (reloading, or sharing the url, would otherwise
  // re-trigger the same addlayer every time). replaceState also drops the
  // trailing '#' that setting location.hash = '' would leave behind, and
  // - unlike setting location.hash - never fires its own 'hashchange', so
  // there's no risk of this looping back into this same handler.
  window.history.replaceState(
    null,
    '',
    window.location.pathname + window.location.search,
  );

  const alreadyAdded = existingLayers.some(
    (layer) =>
      layer.serviceUrl === parsed.serviceUrl && layer.name === parsed.name,
  );
  if (alreadyAdded) {
    return;
  }
  dispatch(
    thunks.addLayer({
      mapId,
      serviceUrl: parsed.serviceUrl,
      name: parsed.name,
    }),
  )
    .unwrap()
    .catch((e: unknown) => {
      // eslint-disable-next-line no-console
      console.warn(e);
    });
};
