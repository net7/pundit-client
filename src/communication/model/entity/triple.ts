import { WebPage } from './web-page';

export interface Predicate {
    label: string,
    uri: string
}
export interface SemanticTripleBase {
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
}

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
