import { Component, Input } from '@angular/core';
import { AnnotationComment, SocialType } from '@pundit/communication';
import { Observable } from 'rxjs';

@Component({
  selector: 'pnd-social-annotation-section',
  templateUrl: './social-annotation-section.html'
})
export class SocialAnnotationSectionComponent {
  id = 'social';

  @Input() public socials$: Observable<any>;

  @Input() public comments$: Observable<AnnotationComment[]>;

  @Input() public annotationId: string;

  @Input() public emit: any;

  public readonly ACTIONS: (SocialType | 'Comment')[]= ['Like', 'Comment', 'Dislike', 'Report', 'Comment'];
}
