import { actions } from '../store/store';
import { handleWindowLocationQueryString } from './handleWindowLocationQueryString';

jest.mock('@opengeoweb/webmap', () => ({
  getWMLayerById: jest.fn(),
  LayerType: { baseLayer: 'baseLayer', overLayer: 'overLayer' },
}));

const mapId = 'map1';

const setUrl = (search: string): void => {
  window.history.pushState({}, '', `http://localhost/${search}`);
};

describe('handleWindowLocationQueryString', () => {
  afterEach(() => {
    window.history.pushState({}, '', 'http://localhost/');
  });

  it('dispatches a plain, serializable bbox object rather than a WMBBOX instance', () => {
    setUrl('?srs=EPSG%3A3857&bbox=-1,-2,3,4');
    const dispatch = jest.fn();

    handleWindowLocationQueryString(mapId, dispatch);

    const expectedAction = actions.requestSetProjection({
      mapId,
      srs: 'EPSG:3857',
      bbox: { left: -1, bottom: -2, right: 3, top: 4 },
    });
    expect(dispatch).toHaveBeenCalledWith(expectedAction);

    // Regression guard: a WMBBOX instance has its own bound methods, which
    // the Redux DevTools extension can't structured-clone to relay the
    // action - that clone failure stops the dispatch dead, so nothing
    // after it (e.g. adding layers from the same permalink) ever runs.
    const [dispatchedAction] = dispatch.mock.calls.find(
      ([action]) => action.type === expectedAction.type,
    );
    expect(Object.getPrototypeOf(dispatchedAction.payload.bbox)).toBe(
      Object.prototype,
    );
  });

  it('does not dispatch requestSetProjection for a malformed bbox', () => {
    setUrl('?srs=EPSG%3A3857&bbox=not,a,valid,bbox');
    const dispatch = jest.fn();

    handleWindowLocationQueryString(mapId, dispatch);

    expect(dispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: 'wmsservices/requestSetProjection' }),
    );
  });

  it('does not dispatch requestSetProjection when srs or bbox is missing', () => {
    setUrl('?bbox=-1,-2,3,4');
    const dispatch = jest.fn();

    handleWindowLocationQueryString(mapId, dispatch);

    expect(dispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: 'wmsservices/requestSetProjection' }),
    );
  });
});
