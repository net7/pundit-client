import { AiAnnotation, AiAnnotationTarget } from 'src/communication';
import { processLLMResponse } from './annotation-llm-processor';
import { buildSegmentProjection } from './annotation-range-utils';

const PORTIA =
  '<p>Her name is Portia, nothing undervalued</p>\n      <p>To Cato\'s daughter, Brutus\' Portia:</p>';

const pendingPayload = {
  type: 'Highlighting',
  notebookId: 'n1',
  subject: { pageTitle: 'The Merchant of Venice', selected: { text: 'whole selection' } },
};

/** Segments of the whole page, as the request would send them. */
const segmentsOf = (html: string) => {
  document.body.innerHTML = html;
  const range = document.createRange();
  range.selectNodeContents(document.body);
  return buildSegmentProjection(range);
};

const target = (overrides: Partial<AiAnnotationTarget>): AiAnnotationTarget => ({
  segment: 'c1',
  end_segment: null,
  exact: '',
  prefix: '',
  suffix: '',
  start: null,
  end: null,
  ...overrides,
});

const highlight = (overrides: Partial<AiAnnotationTarget>): AiAnnotation => ({
  type: 'highlight',
  target: target(overrides),
});

const place = (html: string, annotations: AiAnnotation[], requested: any = 'highlight') => {
  const { segments, segmentMap } = segmentsOf(html);
  const payloads = processLLMResponse(annotations, segmentMap, pendingPayload, requested);
  return { segments, segmentMap, payloads };
};

describe('processLLMResponse > placement', () => {
  it('sends the whitespace-only node between the paragraphs as a segment', () => {
    const { segments } = segmentsOf(PORTIA);
    expect(segments).toEqual([
      { id: 'c1', text: 'Her name is Portia, nothing undervalued' },
      { id: 'c2', text: '\n      ' },
      { id: 'c3', text: 'To Cato\'s daughter, Brutus\' Portia:' },
    ]);
  });

  it('places an annotation inside one segment from its offsets', () => {
    const { payloads, segmentMap } = place(PORTIA, [
      highlight({ exact: 'Portia', prefix: 'Her name is ', suffix: ', nothing', start: 12, end: 18 }),
    ]);

    expect(payloads).toHaveLength(1);
    const { selected } = payloads[0].subject;
    expect(selected.text).toBe('Portia');
    expect(selected.rangeSelector).toEqual(expect.objectContaining({ startOffset: 12, endOffset: 18 }));
    expect(segmentMap.get('c1')?.textContent).toBe('Her name is Portia, nothing undervalued');
    // the pending payload is copied, not changed
    expect(payloads[0].notebookId).toBe('n1');
    expect(pendingPayload.subject.selected.text).toBe('whole selection');
  });

  it('places an annotation across segments through a whitespace-only segment', () => {
    const exact = 'nothing undervalued\n      To Cato\'s daughter';
    const { payloads } = place(PORTIA, [
      highlight({ segment: 'c1', end_segment: 'c3', exact, prefix: 'Portia, ', suffix: ', Brutus', start: 20, end: 18 }),
    ]);

    expect(payloads).toHaveLength(1);
    expect(payloads[0].subject.selected.text).toBe(exact);
  });

  it('applies UTF-16 offsets as received after an emoji', () => {
    const { payloads } = place('<p>👋 Her name is Portia</p>', [
      highlight({ exact: 'Portia', start: 15, end: 21 }),
    ]);

    expect(payloads[0].subject.selected.text).toBe('Portia');
    expect(payloads[0].subject.selected.rangeSelector).toEqual(
      expect.objectContaining({ startOffset: 15, endOffset: 21 }),
    );
  });

  it('anchors null offsets on the occurrence the prefix points to', () => {
    const { payloads } = place('<p>Portia met Portia at Belmont</p>', [
      highlight({ exact: 'Portia', prefix: 'met ', suffix: ' at', start: null, end: null }),
    ]);

    expect(payloads[0].subject.selected.rangeSelector).toEqual(
      expect.objectContaining({ startOffset: 11, endOffset: 17 }),
    );
  });

  it('anchors null offsets on the first occurrence when the context does not tell them apart', () => {
    const { payloads } = place('<p>Portia met Portia at Belmont</p>', [
      highlight({ exact: 'Portia', start: null, end: null }),
    ]);

    expect(payloads[0].subject.selected.rangeSelector).toEqual(
      expect.objectContaining({ startOffset: 0, endOffset: 6 }),
    );
  });

  it('reads the context across segments', () => {
    // the suffix " of" is in the next segment
    const { payloads } = place('<p>Portia and Portia<b> of Belmont</b></p>', [
      highlight({ exact: 'Portia', suffix: ' of', start: null, end: null }),
    ]);

    expect(payloads[0].subject.selected.text).toBe('Portia');
    expect(payloads[0].subject.selected.rangeSelector).toEqual(
      expect.objectContaining({ startOffset: 11, endOffset: 17 }),
    );
  });

  it.each([
    ['do not match exact', 0, 6],
    ['are out of the node', 50, 60],
  ])('falls back to the quote when the offsets %s', (_label, start, end) => {
    const { payloads } = place(PORTIA, [
      highlight({ exact: 'Portia', prefix: 'is ', suffix: ',', start, end }),
    ]);

    expect(payloads).toHaveLength(1);
    expect(payloads[0].subject.selected.rangeSelector).toEqual(
      expect.objectContaining({ startOffset: 12, endOffset: 18 }),
    );
  });

  it('skips an annotation whose offsets and quote both miss', () => {
    const { payloads } = place(PORTIA, [highlight({ exact: 'Shylock', start: 0, end: 7 })]);
    expect(payloads).toEqual([]);
  });

  it('skips an annotation on an unknown segment and keeps the others', () => {
    const { payloads } = place(PORTIA, [
      highlight({ segment: 'c9', exact: 'Portia', start: 12, end: 18 }),
      highlight({ segment: 'c1', end_segment: 'c9', exact: 'Portia', start: 12, end: 18 }),
      highlight({ segment: 'c3', exact: 'Brutus', start: 20, end: 26 }),
    ]);

    expect(payloads.map((p) => p.subject.selected.text)).toEqual(['Brutus']);
  });

  it('skips an annotation whose node is no longer in the page', () => {
    const { segmentMap } = segmentsOf(PORTIA);
    document.body.innerHTML = PORTIA;

    expect(
      processLLMResponse([highlight({ exact: 'Portia', start: 12, end: 18 })], segmentMap, pendingPayload, 'highlight'),
    ).toEqual([]);
  });

  it('keeps the order of the response', () => {
    const { payloads } = place(PORTIA, [
      highlight({ segment: 'c3', exact: 'Brutus', start: 20, end: 26 }),
      highlight({ exact: 'Portia', start: 12, end: 18 }),
    ]);

    expect(payloads.map((p) => p.subject.selected.text)).toEqual(['Brutus', 'Portia']);
  });
});

describe('processLLMResponse > content', () => {
  const portia = target({ exact: 'Portia', start: 12, end: 18 });

  it('builds the semantic triple as an object picked from the element search', () => {
    const { payloads } = place(PORTIA, [{
      type: 'semantic_annotation',
      target: portia,
      triples: [{
        predicate: { uri: 'http://www.w3.org/2000/01/rdf-schema#isDefinedBy', label: 'identifies' },
        object: {
          uri: 'http://example.org/shakespeare#Portia',
          label: 'Portia',
          description: 'Heiress of Belmont',
          elementType: 'entity',
        },
      }],
    }], 'semantic_annotation');

    expect(payloads[0].type).toBe('Linking');
    expect(payloads[0].content).toEqual([{
      predicate: { label: 'identifies', uri: 'http://www.w3.org/2000/01/rdf-schema#isDefinedBy' },
      objectType: 'uri',
      object: {
        uri: 'http://example.org/shakespeare#Portia',
        label: 'Portia',
        description: 'Heiress of Belmont',
        source: 'search',
        elementType: 'entity',
      },
    }]);
  });

  it('leaves out the description of an object without one', () => {
    const { payloads } = place(PORTIA, [{
      type: 'semantic_annotation',
      target: portia,
      triples: [{
        predicate: { uri: 'http://example.org/p#names', label: 'names' },
        object: { uri: 'http://example.org/c#Person', label: 'Person', elementType: 'class' },
      }],
    }], 'semantic_annotation');

    expect(payloads[0].content[0].object).toEqual({
      uri: 'http://example.org/c#Person', label: 'Person', source: 'search', elementType: 'class',
    });
  });

  it('builds the semantic triple with a literal object', () => {
    const { payloads } = place(PORTIA, [{
      type: 'semantic_annotation',
      target: portia,
      triples: [{
        predicate: { uri: 'http://purl.org/dc/terms/date', label: 'represents the date' },
        object: { text: '1776-07-04' },
      }],
    }], 'semantic_annotation');

    expect(payloads[0].type).toBe('Linking');
    expect(payloads[0].content).toEqual([{
      predicate: { label: 'represents the date', uri: 'http://purl.org/dc/terms/date' },
      objectType: 'literal',
      object: { text: '1776-07-04' },
    }]);
  });

  it('trims the text of a literal object', () => {
    const { payloads } = place(PORTIA, [{
      type: 'semantic_annotation',
      target: portia,
      triples: [{
        predicate: { uri: 'http://purl.org/dc/terms/date', label: 'represents the date' },
        object: { text: '  1776  ' },
      }],
    }], 'semantic_annotation');

    expect(payloads[0].content[0].object).toEqual({ text: '1776' });
  });

  const identifiesPortia = {
    predicate: { uri: 'http://www.w3.org/2000/01/rdf-schema#isDefinedBy', label: 'identifies' },
    object: { uri: 'http://example.org/shakespeare#Portia', label: 'Portia', elementType: 'entity' as const },
  };
  const livesInBelmont = {
    predicate: { uri: 'http://example.org/shakespeare#livesIn', label: 'lives in' },
    object: { uri: 'http://example.org/shakespeare#Belmont', label: 'Belmont', elementType: 'entity' as const },
  };
  const representsTheDate = {
    predicate: { uri: 'http://purl.org/dc/terms/date', label: 'represents the date' },
    object: { text: '1596' },
  };

  it('builds one annotation with all the triples of the place, in their order', () => {
    const { payloads } = place(PORTIA, [{
      type: 'semantic_annotation',
      target: portia,
      triples: [identifiesPortia, livesInBelmont, representsTheDate],
    }], 'semantic_annotation');

    expect(payloads).toHaveLength(1);
    expect(payloads[0].type).toBe('Linking');
    expect(payloads[0].subject.selected.text).toBe('Portia');
    expect(payloads[0].content).toEqual([
      {
        predicate: { label: 'identifies', uri: 'http://www.w3.org/2000/01/rdf-schema#isDefinedBy' },
        objectType: 'uri',
        object: { uri: 'http://example.org/shakespeare#Portia', label: 'Portia', source: 'search', elementType: 'entity' },
      },
      {
        predicate: { label: 'lives in', uri: 'http://example.org/shakespeare#livesIn' },
        objectType: 'uri',
        object: { uri: 'http://example.org/shakespeare#Belmont', label: 'Belmont', source: 'search', elementType: 'entity' },
      },
      {
        predicate: { label: 'represents the date', uri: 'http://purl.org/dc/terms/date' },
        objectType: 'literal',
        object: { text: '1596' },
      },
    ]);
  });

  it('leaves out an incomplete triple and keeps the others of the place', () => {
    const { payloads } = place(PORTIA, [{
      type: 'semantic_annotation',
      target: portia,
      triples: [
        identifiesPortia,
        { predicate: { uri: '', label: 'lives in' }, object: livesInBelmont.object },
        { predicate: representsTheDate.predicate, object: { text: '   ' } },
        livesInBelmont,
      ],
    }], 'semantic_annotation');

    expect(payloads).toHaveLength(1);
    expect(payloads[0].content.map((triple: any) => triple.object.label)).toEqual(['Portia', 'Belmont']);
  });

  it('skips a semantic annotation whose triples are all incomplete', () => {
    const { payloads } = place(PORTIA, [{
      type: 'semantic_annotation',
      target: portia,
      triples: [
        { predicate: { uri: '', label: 'lives in' }, object: livesInBelmont.object },
        { predicate: representsTheDate.predicate, object: { text: '' } },
      ],
    }], 'semantic_annotation');

    expect(payloads).toEqual([]);
  });

  it.each([
    ['no triples', undefined],
    ['an empty list of triples', []],
  ])('skips a semantic annotation with %s', (_label, triples: any) => {
    const { payloads } = place(PORTIA, [{ type: 'semantic_annotation', target: portia, triples }]);
    expect(payloads).toEqual([]);
  });

  it.each([
    ['a predicate without uri', {
      predicate: { uri: '', label: 'names' },
      object: { uri: 'http://example.org/c#Person', label: 'Person', elementType: 'class' },
    }],
    ['an object without uri', {
      predicate: { uri: 'http://example.org/p#names', label: 'names' },
      object: { uri: '', label: 'Person', elementType: 'class' },
    }],
    ['a literal object with an empty text', {
      predicate: { uri: 'http://purl.org/dc/terms/date', label: 'represents the date' },
      object: { text: '' },
    }],
    ['a literal object with a blank text', {
      predicate: { uri: 'http://purl.org/dc/terms/date', label: 'represents the date' },
      object: { text: '   ' },
    }],
    ['a literal object and a predicate without uri', {
      predicate: { uri: '', label: 'represents the date' },
      object: { text: '1776-07-04' },
    }],
  ])('skips a semantic annotation whose only triple has %s', (_label, triple: any) => {
    const { payloads } = place(PORTIA, [{ type: 'semantic_annotation', target: portia, triples: [triple] }]);
    expect(payloads).toEqual([]);
  });

  it('keeps the comment as received', () => {
    const { payloads } = place(PORTIA, [{ type: 'comment', target: portia, comment: 'Bassanio &amp; Porzia' }]);

    expect(payloads[0].type).toBe('Commenting');
    expect(payloads[0].content).toEqual({ comment: 'Bassanio &amp; Porzia' });
  });

  it('skips a comment annotation without comment', () => {
    const { payloads } = place(PORTIA, [{ type: 'comment', target: portia, comment: '' }]);
    expect(payloads).toEqual([]);
  });

  it('sets the tags as received', () => {
    const { payloads } = place(PORTIA, [{ type: 'tags', target: portia, tags: ['people', 'heiress'] }]);

    expect(payloads[0].type).toBe('Highlighting');
    expect(payloads[0].content).toBeUndefined();
    expect(payloads[0].tags).toEqual(['people', 'heiress']);
  });

  it('skips a tags annotation without tags', () => {
    const { payloads } = place(PORTIA, [{ type: 'tags', target: portia, tags: [] }]);
    expect(payloads).toEqual([]);
  });

  it('uses the requested type for an unknown type', () => {
    const { payloads } = place(
      PORTIA, [{ type: 'linking' as any, target: portia, comment: 'Heiress' }], 'comment',
    );

    expect(payloads[0].type).toBe('Commenting');
    expect(payloads[0].content).toEqual({ comment: 'Heiress' });
  });
});
