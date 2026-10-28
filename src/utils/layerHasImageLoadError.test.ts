import {
  imageSrcBelongsToLayer,
  layerHasImageLoadError,
} from './layerHasImageLoadError';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const makeImage = (hasError: boolean): any => ({
  hasError: () => hasError,
});

const wmLayer = {
  getmapURL: 'https://example.com/adaguc-server/adagucserver?',
  name: 'RADAR',
};

describe('imageSrcBelongsToLayer', () => {
  it('matches a GetMap url for this exact layer and service', () => {
    expect(
      imageSrcBelongsToLayer(
        'https://example.com/adaguc-server/adagucserver?SERVICE=WMS&LAYERS=RADAR',
        wmLayer,
      ),
    ).toBe(true);
  });

  it('rejects a url for a different layer name on the same service', () => {
    expect(
      imageSrcBelongsToLayer(
        'https://example.com/adaguc-server/adagucserver?SERVICE=WMS&LAYERS=OtherLayer',
        wmLayer,
      ),
    ).toBe(false);
  });

  it('rejects a url for a different service endpoint', () => {
    expect(
      imageSrcBelongsToLayer(
        'https://other-host.com/adaguc-server/adagucserver?SERVICE=WMS&LAYERS=RADAR',
        wmLayer,
      ),
    ).toBe(false);
  });

  it('returns false when the layer has no getmapURL or name yet', () => {
    expect(
      imageSrcBelongsToLayer('https://example.com/x?LAYERS=RADAR', undefined),
    ).toBe(false);
    expect(
      imageSrcBelongsToLayer('https://example.com/x?LAYERS=RADAR', {
        getmapURL: '',
        name: 'RADAR',
      }),
    ).toBe(false);
    expect(
      imageSrcBelongsToLayer('https://example.com/x?LAYERS=RADAR', {
        getmapURL: 'https://example.com/adagucserver?',
        name: '',
      }),
    ).toBe(false);
  });

  it('does not throw for an unparseable url', () => {
    expect(imageSrcBelongsToLayer('not a url', wmLayer)).toBe(false);
  });
});

describe('layerHasImageLoadError', () => {
  it('returns false when no image for this layer has errored', () => {
    const imageStore = {
      imagesbysrc: new Map([
        [
          'https://example.com/adaguc-server/adagucserver?SERVICE=WMS&LAYERS=RADAR',
          makeImage(false),
        ],
      ]),
    };

    expect(layerHasImageLoadError(imageStore, wmLayer)).toBe(false);
  });

  it('returns true when a cached image for this layer has errored', () => {
    const imageStore = {
      imagesbysrc: new Map([
        [
          'https://example.com/adaguc-server/adagucserver?SERVICE=WMS&LAYERS=RADAR',
          makeImage(true),
        ],
      ]),
    };

    expect(layerHasImageLoadError(imageStore, wmLayer)).toBe(true);
  });

  it('ignores errored images that belong to a different layer', () => {
    const imageStore = {
      imagesbysrc: new Map([
        [
          'https://example.com/adaguc-server/adagucserver?SERVICE=WMS&LAYERS=OtherLayer',
          makeImage(true),
        ],
      ]),
    };

    expect(layerHasImageLoadError(imageStore, wmLayer)).toBe(false);
  });
});
