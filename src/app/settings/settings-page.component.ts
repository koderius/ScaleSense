import { Component, OnInit } from '@angular/core';
import {AuthService} from '../services/auth.service';
import {BusinessSide} from '../models/Business';
import {NavigationService} from '../services/navigation.service';

@Component({
  selector: 'app-settings-menu',
  templateUrl: './settings-page.component.html',
  styleUrls: ['./settings-page.component.scss'],
})
export class SettingsPage implements OnInit {

  side: BusinessSide;

  generalOpen: boolean;

  constructor(
    private authService: AuthService,
    private navService: NavigationService,
  ) {
    this.side = this.authService.currentUser.side;
  }

  ngOnInit() {
  }

  goBack() {
    this.navService.goToMain();
  }

}
