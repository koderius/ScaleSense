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
  isSending: boolean;

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


  checkContactFields() {

    // Check there is a name, content and email and/or phone number
    if(!(this.contact.name && this.contact.content && ((this.contact.email || '').match(AuthWebsiteService.EMAIL_REGEX) || this.contact.phone))) {
      alert('יש למלא שם משתמש, תוכן פנייה, ואמצעי יצירת קשר אחד לפחות');
      return false;
    }

    // Check recaptcha
    if(!this.mailService.recaptcha) {
      alert('יש לסמן את תיבת "אני לא רובוט"');
      return false;
    }

    return true;

  }

  // Send email to the support team (executed after front-end recaptcha resolved)
  async sendMail() {

    if(!this.checkContactFields())
      return;

    this.isSending = true;

    if(await this.mailService.sendRegistrationMail(this.contact)) {
      alert('פנייתך נשלחה בהצלחה למערכת ותטופל בהקדם');
      this.contact = {};
    }
    else
      alert('שליחת פנייה נכשלה');

    this.isSending = false;

  }

}
