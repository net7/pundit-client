import { LayoutDataSource } from '@n7-frontend/core';
import { AnnotationData } from '@n7-frontend/components';

export class SidebarLayoutDS extends LayoutDataSource {
  private communication;

  private iconStyle: 'height: 10px; width: 10px; background: tomato;'

  public annotations: AnnotationData[] = [
    {
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
      // icon: {
      //   id: 'n7-icon-angle-down',
      //   payload: 'expand-arrow'
      // },
      body: 'This is a mock annotation',
      comment: 'pretty useful stuff.'
    }, {
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
      // icon: {
      //   id: 'n7-icon-cross',
      //   payload: 'expand-arrow',
      //   style: {
      //     width: '10px',
      //     height: '10px',
      //     background: 'tomato'
      //   }
      // },
      body: 'To annotate or not to annotate, that is the question',
      comment: 'A quote by W.Shakespeare'
    }, {
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
      // icon: {
      //   id: 'n7-icon-cross',
      //   payload: 'expand-arrow',
      //   style: {
      //     width: '10px',
      //     height: '10px',
      //     background: 'tomato'
      //   }
      // },
      body: 'Hello, I am a collapsed annotation!',
      comment: 'And this is a collapsed annotation comment'
    }
  ]

  onInit(payload) {
    this.communication = payload.communication;
    this.one('annotation').update(this.annotations);
  }
}
