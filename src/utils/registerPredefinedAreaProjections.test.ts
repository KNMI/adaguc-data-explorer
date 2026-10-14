import proj4 from 'proj4';
import { register } from 'ol/proj/proj4';
import { registerPredefinedAreaProjections } from './registerPredefinedAreaProjections';

jest.mock('proj4', () => ({
  defs: jest.fn(),
}));
jest.mock('ol/proj/proj4', () => ({
  register: jest.fn(),
}));

const mockProj4Defs = jest.mocked(proj4.defs);
const mockRegister = jest.mocked(register);

describe('registerPredefinedAreaProjections', () => {
  // The module tracks whether it has already registered in its own
  // top-level state, so both assertions have to live in the same test:
  // calling it a second time (in a separate test) would be a silent
  // no-op by the time it runs, making "only registers once" trivially
  // true for the wrong reason.
  it('defines proj4 strings for the presets @opengeoweb/webmap-react does not already register, registers them with OpenLayers, and only does so once', () => {
    registerPredefinedAreaProjections();

    const definedCodes = mockProj4Defs.mock.calls.map(([code]) => code);
    expect(definedCodes).toEqual(expect.arrayContaining(['EPSG:54030']));
    expect(mockRegister).toHaveBeenCalledWith(proj4);
    expect(mockRegister).toHaveBeenCalledTimes(1);

    registerPredefinedAreaProjections();

    expect(mockRegister).toHaveBeenCalledTimes(1);
  });
});
