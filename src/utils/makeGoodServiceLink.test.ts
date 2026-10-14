import { makeGoodServiceLink } from './makeGoodServiceLink';

describe('makeGoodServiceLink', () => {
  it('appends ? to a url with no query string yet', () => {
    expect(makeGoodServiceLink('https://host/autowms')).toBe(
      'https://host/autowms?',
    );
  });

  it('leaves a url that already ends in exactly one ? alone', () => {
    expect(makeGoodServiceLink('https://host/autowms?')).toBe(
      'https://host/autowms?',
    );
  });

  it('leaves a url that already ends in exactly one & alone', () => {
    expect(makeGoodServiceLink('https://host/adagucserver?dataset=test&')).toBe(
      'https://host/adagucserver?dataset=test&',
    );
  });

  it('collapses a doubled-up trailing ?? down to a single ? instead of leaving it broken', () => {
    // Regression guard: this used to be treated as "already has a
    // separator" (it does end in "?") and returned as-is, producing a
    // "??key=value" request no server recognizes - e.g. the AutoWMS
    // browser silently failing for a url like ".../autowms??".
    expect(makeGoodServiceLink('https://host/autowms??')).toBe(
      'https://host/autowms?',
    );
  });

  it('collapses a trailing ?& (or &?) down to a single separator', () => {
    expect(makeGoodServiceLink('https://host/autowms?&')).toBe(
      'https://host/autowms?',
    );
    expect(
      makeGoodServiceLink('https://host/adagucserver?dataset=test&&'),
    ).toBe('https://host/adagucserver?dataset=test&');
  });

  it('adds the missing & when the url already has query params but no trailing separator', () => {
    // Regression guard: without re-checking for an existing "?" earlier in
    // the url, this would append nothing at all, producing a broken
    // "...xkey=value" request with no separator between params.
    expect(makeGoodServiceLink('https://host/adagucserver?dataset=test')).toBe(
      'https://host/adagucserver?dataset=test&',
    );
  });
});
