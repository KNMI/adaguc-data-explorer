import { makeGoodServiceLink } from './makeGoodServiceLink';

// Common ways an AutoWMS explorer endpoint ends up mounted - tried in
// order, keeping the first one whose `request=getfiles` response actually
// looks like a real file listing. '' tries the given url as-is first, so
// an already-correct url still resolves in a single request.
const AUTOWMS_URL_SUFFIXES = ['', 'autowms', 'adaguc-server/autowms'];

const looksLikeAutoWMSListing = (json: unknown): boolean =>
  !!json &&
  typeof json === 'object' &&
  Array.isArray((json as { result?: unknown }).result);

const withSuffix = (url: string, suffix: string): string =>
  suffix ? `${url.replace(/\/+$/, '')}/${suffix}` : url;

// Someone pointing this at an AutoWMS server often only has the bare host
// (e.g. "http://localhost:8080"), not the exact path it's actually mounted
// under - tries that url as given, then each of the common suffixes above,
// returning the first one that actually looks like a real AutoWMS listing,
// or undefined if none of them do.
// eslint-disable-next-line import/prefer-default-export
export const resolveAutoWMSUrl = async (
  url: string,
): Promise<string | undefined> => {
  // eslint-disable-next-line no-restricted-syntax
  for (const suffix of AUTOWMS_URL_SUFFIXES) {
    const candidate = withSuffix(url, suffix);
    try {
      // eslint-disable-next-line no-await-in-loop
      const response = await fetch(
        `${makeGoodServiceLink(candidate)}request=getfiles&path=`,
      );
      // eslint-disable-next-line no-await-in-loop
      const json: unknown = await response.json();
      if (looksLikeAutoWMSListing(json)) {
        return candidate;
      }
    } catch {
      // try the next candidate
    }
  }
  return undefined;
};
