import { Component, Input, OnInit } from '@angular/core';
import { Social, User } from '@pundit/communication';
import { Observable, Subject } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'pnd-social-annotation-section',
  templateUrl: './social-annotation-section.html'
})
export class SocialAnnotationSectionComponent implements OnInit {
    id = 'social';

    @Input() public data$: Subject<any>;

    public social$: Observable<any>;

    ngOnInit(): void {
      this.social$ = this.data$.pipe(map(this.transformData));
    }

    private transformData = (data: {socials: Social[]; users: User[]}) => data
}
