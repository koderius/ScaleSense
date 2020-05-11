import { Component } from '@angular/core';
import {AuthWebsiteService} from './auth-website.service';
import {BusinessSide} from '../models/Business';
import {NavController} from '@ionic/angular';
import {MailService} from './mail/mail.service';
import {MailForm} from './mail/MailForm';

@Component({
  selector: 'app-home',
  templateUrl: 'website-page.component.html',
  styleUrls: ['website-page.component.scss'],
})
export class WebsitePage {

  enterAs: BusinessSide;

  email: string;
  password: string;

  contact: MailForm = {};

  constructor(
    private authService: AuthWebsiteService,
    private navCtrl: NavController,
    public mailService: MailService,
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

  sendMail(recaptcha: string) {
    console.log(recaptcha);
    this.mailService.sendRegistrationMail(recaptcha, this.contact)
  }

}
