import { Component } from '@angular/core';
import {AuthWebsiteService} from './auth-website.service';
import {BusinessSide} from '../models/Business';
import {NavController} from '@ionic/angular';

@Component({
  selector: 'app-home',
  templateUrl: 'website-page.component.html',
  styleUrls: ['website-page.component.scss'],
})
export class WebsitePage {

  enterAs: BusinessSide;

  email: string;
  password: string;

  constructor(
    private authService: AuthWebsiteService,
    private navCtrl: NavController,
  ) {}

  goToRegister() {
    this.navCtrl.navigateRoot('register');
  }

  goToResetPassword() {
    this.navCtrl.navigateRoot('register',{queryParams: {forgotpassword: true}});
  }


  // Get credentials from email & password, and go to app domain
  login() {
    this.authService.createSignInCredential(this.email, this.password);
    const homePage = (this.enterAs == 'c' ? 'customer' : 'supplier');
    this.navCtrl.navigateRoot(homePage);
    // TODO: Change app domain
    // window.open('https://APP-DOMAIN.com/' + homePage);
  }

}
