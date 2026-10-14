import { XmlJsonNode, xmlToJson } from './xmlToJson';

const parse = (xml: string): Document =>
  new DOMParser().parseFromString(xml, 'text/xml');

describe('xmlToJson', () => {
  it('converts a single nested element into a keyed object with a value', () => {
    const doc = parse('<root><name>hello</name></root>');

    expect(xmlToJson(doc)).toEqual({
      attr: {},
      root: {
        attr: {},
        name: { attr: {}, value: 'hello' },
      },
    });
  });

  it('collects attributes onto the element under attr', () => {
    const doc = parse('<root><item id="1" srsName="EPSG:4326"/></root>');

    expect(xmlToJson(doc)).toEqual({
      attr: {},
      root: {
        attr: {},
        item: { attr: { id: '1', srsName: 'EPSG:4326' } },
      },
    });
  });

  it('collapses repeated sibling tags into an array', () => {
    const doc = parse(
      '<root><item>a</item><item>b</item><item>c</item></root>',
    );

    const json = xmlToJson(doc);
    expect((json.root as XmlJsonNode).item).toEqual([
      { attr: {}, value: 'a' },
      { attr: {}, value: 'b' },
      { attr: {}, value: 'c' },
    ]);
  });

  it('handles namespaced tag names verbatim', () => {
    const doc = parse(
      '<root xmlns:gml="http://example.com/gml"><gml:pos>1 2</gml:pos></root>',
    );

    const json = xmlToJson(doc);
    expect((json.root as XmlJsonNode)['gml:pos']).toEqual({
      attr: {},
      value: '1 2',
    });
  });
});
