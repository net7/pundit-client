import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { Reply, SocialType } from '@pundit/communication';
import { Observable } from 'rxjs';
import { ReplyType, ReplyComponent } from './reply/reply';
import { SocialActionBarComponent } from './social-action-bar/social-action-bar';
import { AsyncPipe } from '@angular/common';

@Component({
    selector: 'pnd-social-annotation-section',
    templateUrl: './social-annotation-section.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [SocialActionBarComponent, ReplyComponent, AsyncPipe]
})
export class SocialAnnotationSectionComponent {
  id = 'social';

  @Input() public socials$!: Observable<any>;

  @Input() public replies$!: Observable<Reply[]>;

  @Input() public annotationId!: string;

  @Input() public emit: any;

  public readonly ACTIONS: (SocialType | ReplyType)[] = ['Like', 'Dislike', 'Report', 'Reply'];
}
