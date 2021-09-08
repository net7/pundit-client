import { Component, Input } from '@angular/core';
import { Reply, SocialType } from '@pundit/communication';
import { Observable } from 'rxjs';
import { ReplyType } from './reply/reply';

@Component({
  selector: 'pnd-social-annotation-section',
  templateUrl: './social-annotation-section.html'
})
export class SocialAnnotationSectionComponent {
  id = 'social';

  @Input() public socials$: Observable<any>;

  @Input() public replies$: Observable<Reply[]>;

  @Input() public annotationId: string;

  @Input() public emit: any;

  public readonly ACTIONS: (SocialType | ReplyType)[]= ['Like', 'Dislike', 'Report', 'Reply'];
}
