import { WebPage } from './web-page';

export interface Predicate {
    label: string,
    uri: string
}
export interface SemanticTripleBase {
    /**
     * `target` (or absent on old triples): the triple is about the annotated
     * fragment and has no `subject`; `uri`: it is about `subject`.
     */
    subjectType?: 'target' | 'uri',
    /**
     * What the triple is about: an ontology element (class or entity) or a
     * hand-typed URI. Absent: the subject is the annotated fragment.
     */
    subject?: ObjectUri | LiteralUri,
    predicate: Predicate,
}
export interface SemanticTripleWithPage extends SemanticTripleBase {
    objectType: 'textFragment',
    object: WebPage
}
export interface SemanticTripleWithLiteral extends SemanticTripleBase {
    objectType: 'literal',
    object: {
        text: string
    }
}

export interface UriRdfTypes {
    label: string,
    uri: string
}

export interface ObjectUri {
    uri: string,
    label?: string,
    description?: string,
    depiction?: string,
    source: 'search' // da valutare attentamente,
    rdfTypes?: UriRdfTypes[],
    /** Kind of ontology element the object was picked as (display only). */
    elementType?: ObjectUriElementType,
}

export type ObjectUriElementType = 'class' | 'entity';

export type LiteralUri = {
    uri: string,
    source: 'free-text',
    label?: string
    description?: string,
}

export interface SemanticTripleWithUri extends SemanticTripleBase {
    objectType: 'uri',
    object: ObjectUri | LiteralUri
}

export interface ObjectDate {
    date: string,
    format?: string;
}
export interface SemanticTripleWithDate extends SemanticTripleBase {
    objectType: 'date',
    object: ObjectDate
}

export type SemanticTripleType =
SemanticTripleWithLiteral |
SemanticTripleWithPage |
SemanticTripleWithUri |
SemanticTripleWithDate;
