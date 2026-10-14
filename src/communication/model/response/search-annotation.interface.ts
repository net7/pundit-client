import {
  Annotation, Notebook, Social, BaseUser, Reply
} from '../entity';
import { Facet } from '../request';

export interface SearchAnnotationResults {
  annotations: Annotation[],
  notebooks: Notebook[],
  users: BaseUser[]
  socials: Social[],
  replies: Reply[]
  facets?: Facet[],
  stats:{
      total: number,
      [key: string]: any
  }
}
