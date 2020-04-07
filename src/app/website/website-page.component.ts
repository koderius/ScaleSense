import { Component } from '@angular/core';
import {AuthService} from '../services/auth.service';
import {BusinessSide} from '../models/Business';
import {NavController} from '@ionic/angular';

@Component({
  selector: 'app-home',
  templateUrl: 'website-page.component.html',
  styleUrls: ['website-page.component.scss'],
})
export class WebsitePage {

  enterAs: BusinessSide;

  constructor(
    private authService: AuthService,
    private navCtrl: NavController,
  ) {}

  goToRegister() {
    this.navCtrl.navigateRoot('register');
  }

  goToResetPassword() {
    this.navCtrl.navigateRoot('register',{queryParams: {forgotpassword: true}});
  }

}
