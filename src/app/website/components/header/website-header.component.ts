import { Component, OnInit } from '@angular/core';
import {NavigationService} from '../../../services/navigation.service';

@Component({
  selector: 'website-header',
  templateUrl: './website-header.component.html',
  styleUrls: ['./website-header.component.scss'],
})
export class WebsiteHeaderComponent implements OnInit {

  constructor(private navService: NavigationService) { }

  ngOnInit() {}

  goHome() {
    this.navService.goToWebHomepage();
  }

}
