import { AiAnnotationTriple } from 'src/communication';
import { buildSemanticContent } from './annotation-llm-helpers.util';

const SH = 'http://example.org/shakespeare#';

const portiaSubject = {
  uri: `${SH}Portia`,
  label: 'Portia',
  description: 'Heiress of Belmont',
  elementType: 'entity' as const,
};
const bassanioSubject = { uri: `${SH}Bassanio`, label: 'Bassanio', elementType: 'entity' as const };

const identifiesPortia: AiAnnotationTriple = {
  predicate: { uri: 'http://www.w3.org/2000/01/rdf-schema#isDefinedBy', label: 'identifies' },
  object: { uri: `${SH}Portia`, label: 'Portia', elementType: 'entity' },
};
const livesInBelmont: AiAnnotationTriple = {
  predicate: { uri: `${SH}livesIn`, label: 'lives in' },
  object: { uri: `${SH}Belmont`, label: 'Belmont', elementType: 'entity' },
};
const loves: AiAnnotationTriple = {
  predicate: { uri: `${SH}loves`, label: 'loves' },
  object: { uri: `${SH}Bassanio`, label: 'Bassanio', elementType: 'entity' },
};
const friendOfAntonio: AiAnnotationTriple = {
  predicate: { uri: `${SH}friendOf`, label: 'friend of' },
  object: { uri: `${SH}Antonio`, label: 'Antonio', elementType: 'entity' },
};

const savedPortia = {
  uri: `${SH}Portia`,
  label: 'Portia',
  description: 'Heiress of Belmont',
  source: 'search',
  elementType: 'entity',
};

describe('buildSemanticContent > subject', () => {
  it('saves an element subject like a subject picked from the element search', () => {
    expect(buildSemanticContent([{ subject: portiaSubject, ...livesInBelmont }])).toEqual([{
      subjectType: 'uri',
      subject: savedPortia,
      predicate: { label: 'lives in', uri: `${SH}livesIn` },
      objectType: 'uri',
      object: { uri: `${SH}Belmont`, label: 'Belmont', source: 'search', elementType: 'entity' },
    }]);
  });

  it('leaves out the description of a subject without one', () => {
    const [triple] = buildSemanticContent([{ subject: bassanioSubject, ...friendOfAntonio }])!;
    expect(triple.subject).toEqual({
      uri: `${SH}Bassanio`, label: 'Bassanio', source: 'search', elementType: 'entity',
    });
  });

  it('keeps a literal object of a triple with a subject', () => {
    const [triple] = buildSemanticContent([{
      subject: portiaSubject,
      predicate: { uri: 'http://purl.org/dc/terms/date', label: 'represents the date' },
      object: { text: ' 1596 ' },
    }])!;
    expect(triple).toEqual({
      subjectType: 'uri',
      subject: savedPortia,
      predicate: { label: 'represents the date', uri: 'http://purl.org/dc/terms/date' },
      objectType: 'literal',
      object: { text: '1596' },
    });
  });

  it('builds a triple without subject exactly as before', () => {
    expect(buildSemanticContent([identifiesPortia])).toEqual([{
      predicate: { label: 'identifies', uri: 'http://www.w3.org/2000/01/rdf-schema#isDefinedBy' },
      objectType: 'uri',
      object: { uri: `${SH}Portia`, label: 'Portia', source: 'search', elementType: 'entity' },
    }]);
  });

  it.each([
    ['an empty uri', { ...portiaSubject, uri: '' }],
    ['no uri', { label: 'Portia', elementType: 'entity' }],
    ['null', null],
    ['a string', `${SH}Portia`],
  ])('keeps the triple about the fragment when the subject has %s', (_label, subject: any) => {
    const [triple] = buildSemanticContent([{ subject, ...livesInBelmont }])!;
    expect(triple).toEqual(buildSemanticContent([livesInBelmont])![0]);
    expect(triple).not.toHaveProperty('subject');
    expect(triple).not.toHaveProperty('subjectType');
  });

  it('leaves out an incomplete triple with a subject', () => {
    expect(buildSemanticContent([
      { subject: portiaSubject, predicate: { uri: '', label: 'lives in' }, object: livesInBelmont.object },
    ])).toBeUndefined();
  });

  it('keeps the order received: fragment triples, then the subjects as grouped', () => {
    const content = buildSemanticContent([
      identifiesPortia,
      { subject: portiaSubject, ...livesInBelmont },
      { subject: portiaSubject, ...loves },
      { subject: bassanioSubject, ...friendOfAntonio },
    ])!;
    expect(content.map((t) => [t.subject?.uri ?? null, t.predicate.label])).toEqual([
      [null, 'identifies'],
      [`${SH}Portia`, 'lives in'],
      [`${SH}Portia`, 'loves'],
      [`${SH}Bassanio`, 'friend of'],
    ]);
  });

  it('never sorts by subject', () => {
    const content = buildSemanticContent([
      { subject: bassanioSubject, ...friendOfAntonio },
      identifiesPortia,
      { subject: portiaSubject, ...livesInBelmont },
    ])!;
    expect(content.map((t) => t.predicate.label)).toEqual(['friend of', 'identifies', 'lives in']);
  });

  it('keeps the order when an incomplete triple is left out', () => {
    const content = buildSemanticContent([
      identifiesPortia,
      { subject: portiaSubject, predicate: { uri: '', label: 'x' }, object: livesInBelmont.object },
      { subject: portiaSubject, ...loves },
      { subject: bassanioSubject, ...friendOfAntonio },
    ])!;
    expect(content.map((t) => t.predicate.label)).toEqual(['identifies', 'loves', 'friend of']);
  });
});
