import { BaseUser, Notebook } from '../entity';
import { Facet } from './facet.interface';

export interface SearchNotebookResults {
    notebooks: Notebook[],
    users: BaseUser[],
    facets?: Facet[],
    stats:{
        total: number,
        [key: string]: any
    }
}
