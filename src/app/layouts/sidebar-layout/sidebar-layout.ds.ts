import { LayoutDataSource } from '@n7-frontend/core';
import { AnnotationData } from '@n7-frontend/components';
import { BehaviorSubject } from 'rxjs';

export class SidebarLayoutDS extends LayoutDataSource {
  private communication;

  private isCollapsed = new BehaviorSubject(false)

  public annotations: AnnotationData[] = [
    {
      _meta: 'annotation-01',
      payload: { type: 'collapse', uid: 'annotation-01' },
      user: {
        image: 'https://placeimg.com/400/600/people',
        name: 'John Doe',
        anchor: {
          payload: 'user-page',
        }
      },
      isCollapsed: false,
      date: '18 minutes ago',
      notebook: {
        name: 'notebook-2019',
        anchor: { href: '/notebook-2019', target: '_blank' }
      },
      body: 'This is a mock annotation',
      comment: 'pretty useful stuff.'
    }, {
      _meta: 'annotation-02',
      payload: { type: 'collapse', uid: 'annotation-02' },
      user: {
        image: 'https://placeimg.com/400/600/people',
        name: 'John Doe',
        anchor: {
          payload: 'user-page',
        }
      },
      isCollapsed: false,
      date: '18 minutes ago',
      notebook: {
        name: 'notebook-2019',
        anchor: { href: '/notebook-2019', target: '_blank' }
      },
      body: 'To annotate or not to annotate, that is the question',
      comment: 'A quote by W.Shakespeare'
    }, {
      _meta: 'annotation-03',
      payload: { type: 'collapse', uid: 'annotation-03' },
      user: {
        image: 'https://placeimg.com/400/600/people',
        name: 'John Doe',
        anchor: {
          payload: 'user-page',
        }
      },
      isCollapsed: true,
      date: '18 minutes ago',
      notebook: {
        name: 'notebook-2019',
        anchor: { href: '/notebook-2019', target: '_blank' }
      },
      body: 'Hello, I am a collapsed annotation!',
      comment: 'And this is a collapsed annotation comment'
    }
  ]

  onInit(payload) {
    this.communication = payload.communication;
    this.one('annotation').update(this.annotations);
  }
}
