import { Component, OnInit } from '@angular/core';
import {BusinessSide} from '../models/Business';
import {NavigationService} from '../services/navigation.service';
import {AuthSoftwareService} from '../services/auth-software.service';

@Component({
  selector: 'app-settings-menu',
  templateUrl: './settings-page.component.html',
  styleUrls: ['./settings-page.component.scss'],
})
export class SettingsPage implements OnInit {

  side: BusinessSide;

  generalOpen: boolean;

  constructor(
    private authService: AuthSoftwareService,
    public navService: NavigationService,
  ) {
    this.side = this.authService.currentUser.side;
  }

  ngOnInit() {
  }

}
