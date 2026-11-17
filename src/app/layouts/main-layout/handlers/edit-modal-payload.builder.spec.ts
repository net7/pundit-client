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
      subjectType: 'target',
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
      { subjectType: 'target', predicate, objectType: 'literal', object: { text: 'Pearson' } },
      {
        subjectType: 'target', predicate, objectType: 'uri', object: { uri: 'https://pearson.com', source: 'free-text' }
      },
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

  describe('element subjects', () => {
    const dante = {
      uri: 'http://onto/Dante', label: 'Dante Alighieri', elementType: 'entity', source: 'search'
    };
    const beatrice = {
      uri: 'http://onto/Beatrice', label: 'Beatrice', elementType: 'entity', source: 'search'
    };

    it('saves the subject of an element group and none for the selection', () => {
      const payload = build([
        { predicate, objectType: 'literal', object: { label: 'Durante', uri: null }, subject: dante },
        { predicate, objectType: 'literal', object: { label: 'Dante', uri: null } },
      ]);
      expect(payload.content).toEqual([
        { subjectType: 'uri', subject: dante, predicate, objectType: 'literal', object: { text: 'Durante' } },
        { subjectType: 'target', predicate, objectType: 'literal', object: { text: 'Dante' } },
      ]);
    });

    it('saves a typed URI subject like a typed URI object', () => {
      const payload = build([{
        predicate, objectType: 'literal', object: { label: 'Vita nova', uri: null },
        subject: { uri: 'https://example.org/vita-nova', label: 'https://example.org/vita-nova', source: 'free-text' },
      }]);
      expect(payload.content).toEqual([{
        subjectType: 'uri',
        subject: { uri: 'https://example.org/vita-nova', source: 'free-text' },
        predicate, objectType: 'literal', object: { text: 'Vita nova' },
      }]);
    });

    it('saves an unedited row as stored, subject included', () => {
      const stored = {
        subjectType: 'uri', subject: dante, predicate, objectType: 'literal', object: { text: 'Durante' }
      };
      const payload = build([{
        predicate, objectType: 'literal', object: { label: 'Durante' }, subject: dante, _raw: stored
      }]);
      expect(payload.content).toEqual([stored]);
    });

    it('replaces only the subject of an unedited row whose group changed subject', () => {
      const date = {
        subjectType: 'uri', subject: dante, predicate, objectType: 'date', object: { date: '1265-05-21' }
      };
      const payload = build([
        { predicate, objectType: null, object: null, subject: beatrice, subjectChanged: true, _raw: date },
        { predicate, objectType: null, object: null, subjectChanged: true, _raw: date },
      ]);
      expect(payload.content).toEqual([
        { ...date, subjectType: 'uri', subject: beatrice },
        { subjectType: 'target', predicate, objectType: 'date', object: { date: '1265-05-21' } },
      ]);
    });

    it('moves an unedited triple about the fragment to a concept', () => {
      // the server always returns subjectType: a stored "target" must not survive the move
      const stored = { subjectType: 'target', predicate, objectType: 'date', object: { date: '1265-05-21' } };
      const payload = build([
        { predicate, objectType: null, object: null, subject: dante, subjectChanged: true, _raw: stored },
      ]);
      expect(payload.content).toEqual([
        { subjectType: 'uri', subject: dante, predicate, objectType: 'date', object: { date: '1265-05-21' } },
      ]);
    });

    it('moves an unedited triple about a concept back to the fragment', () => {
      const stored = {
        subjectType: 'uri', subject: dante, predicate, objectType: 'date', object: { date: '1265-05-21' }
      };
      const payload = build([
        { predicate, objectType: null, object: null, subjectChanged: true, _raw: stored },
      ]);
      expect(payload.content).toEqual([
        { subjectType: 'target', predicate, objectType: 'date', object: { date: '1265-05-21' } },
      ]);
      expect(payload.content[0]).not.toHaveProperty('subject');
    });

    it('keeps an unedited triple with the same subject exactly as stored', () => {
      const stored = { subjectType: 'target', predicate, objectType: 'date', object: { date: '1265-05-21' } };
      const payload = build([{ predicate, objectType: null, object: null, _raw: stored }]);
      expect(payload.content[0]).toBe(stored);
    });
  });
});
