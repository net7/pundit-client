import { EditModalPayloadBuilder } from './edit-modal-payload.builder';

const predicate = { label: 'is related to', uri: 'http://www.w3.org/2004/02/skos/core#related' };

const build = (semantic: any[]) => {
  const payload: any = {};
  EditModalPayloadBuilder.applyFormValuesToPayload(payload, { semantic: { value: semantic } } as any);
  return payload;
};

describe('EditModalPayloadBuilder > semantic rows', () => {
  it('saves an object picked from the autocomplete as a search URI with its element type', () => {
    const payload = build([{
      predicate,
      objectType: 'uri',
      object: {
        uri: 'http://xmlns.com/foaf/0.1/Person', label: 'Person', source: 'search', elementType: 'class'
      },
    }]);
    expect(payload.type).toBe('Linking');
    expect(payload.content).toEqual([{
      predicate,
      objectType: 'uri',
      object: {
        uri: 'http://xmlns.com/foaf/0.1/Person', label: 'Person', source: 'search', elementType: 'class'
      },
    }]);
  });

  it('saves free text as a literal and a typed URI as free-text URI', () => {
    const payload = build([
      { predicate, objectType: 'literal', object: { label: 'Pearson', uri: null } },
      { predicate, objectType: 'uri', object: { label: 'https://pearson.com', uri: null } },
    ]);
    expect(payload.content).toEqual([
      { predicate, objectType: 'literal', object: { text: 'Pearson' } },
      { predicate, objectType: 'uri', object: { uri: 'https://pearson.com', source: 'free-text' } },
    ]);
  });

  it('saves an unedited row exactly as its stored triple', () => {
    const legacy = {
      predicate,
      objectType: 'uri',
      object: {
        uri: 'http://dbpedia.org/resource/Pearson', label: 'Pearson', source: 'search',
        rdfTypes: [{ uri: 'http://dbpedia.org/ontology/Company', label: 'Company' }],
      },
    };
    const date = { predicate, objectType: 'date', object: { date: '2015-08-12' } };
    const payload = build([
      { predicate, objectType: 'uri', object: { label: 'Pearson', uri: legacy.object.uri }, _raw: legacy },
      { predicate, objectType: null, object: null, _raw: date },
    ]);
    expect(payload.content).toEqual([legacy, date]);
  });
});
