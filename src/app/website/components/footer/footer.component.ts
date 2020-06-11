import { Component, OnInit } from '@angular/core';
import {NavigationService} from '../../../services/navigation.service';

@Component({
  selector: 'website-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
})
export class FooterComponent implements OnInit {

  constructor(private navService: NavigationService) { }

  ngOnInit() {}

  goHome() {
    this.navService.goToWebHomepage();
  }

  register() {
    this.navService.goToRegister();
  }

}
