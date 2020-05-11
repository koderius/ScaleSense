import { Component, OnInit } from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {AuthWebsiteService} from '../auth-website.service';
import {NavController} from '@ionic/angular';
import {UserDoc} from '../../models/UserDoc';
import {MailService} from '../mail/mail.service';

enum PageStatus {

  CONTACT = 10,
  CONTACT_DONE = 11,

  FIRST_STEP = 21,
  SECOND_STEP = 22,
  THIRD_STEP = 23,
  REGISTRATION_DONE = 24,

  FORGOT_PASSWORD = 40,
  RESET_PASSWORD_EMAIL_SENT = 41,
  RESET_PASSWORD = 42,

}

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
})
export class RegisterPage implements OnInit {

  PageStatus = PageStatus;
  pageStatus: PageStatus;

  // Page ID
  id: string;

  // Details for contact
  businessName: string;
  fullName: string;
  email: string;
  phone: string;
  password: string;
  passwordV: string;

  userDoc: UserDoc = {} as UserDoc;


  constructor(
    private authService: AuthWebsiteService,
    private activatedRoute: ActivatedRoute,
    private navCtrl: NavController,
    public mailService: MailService,
  ) {}

  ngOnInit() {

    // Entering the page with 'forgotpassword' query
    if(this.activatedRoute.snapshot.queryParams['forgotpassword']) {
      this.pageStatus = PageStatus.FORGOT_PASSWORD;
      return;
    }

    // Entering the page with reset password link
    if(this.authService.mode == 'resetPassword') {
      this.pageStatus = PageStatus.RESET_PASSWORD;
      return;
    }

    // Get the ID from the URL
    this.id = this.activatedRoute.snapshot.params['id'];

    if(this.id === '0')
      this.pageStatus = PageStatus.CONTACT;
    else {
      // TODO: Check if the ID belong to a user that connected the company
      if(true)
        this.pageStatus = PageStatus.FIRST_STEP;
      else
        this.navCtrl.navigateRoot('site');
    }

  }


  // Which inputs fields to show in each status
  inputToShow(inputName: string) {
    let inputs = [];
    switch (this.pageStatus) {
      case PageStatus.CONTACT: inputs = ['businessName', 'name', 'email', 'phone']; break;
      case PageStatus.FORGOT_PASSWORD: case PageStatus.RESET_PASSWORD_EMAIL_SENT: inputs = ['email']; break;
      case PageStatus.RESET_PASSWORD: inputs = ['password', 'passwordV']; break;
    }
    return inputs.indexOf(inputName) > -1;
  }

  subheaderToShow() {
    if(this.pageStatus == PageStatus.FORGOT_PASSWORD)
      return 'נא למלא כתובת דוא"ל';
    if(this.pageStatus == PageStatus.RESET_PASSWORD)
      return 'נא לעדכן סיסמה חדשה';
  }

  buttonText() {
    switch (this.pageStatus) {
      case PageStatus.CONTACT: case PageStatus.FORGOT_PASSWORD: case PageStatus.RESET_PASSWORD_EMAIL_SENT: return 'שליחה';
      case PageStatus.FIRST_STEP: case PageStatus.SECOND_STEP: return 'המשך';
      case PageStatus.RESET_PASSWORD: return 'איפוס';
    }
  }

  buttonAction() {
    this.checkFields();
    switch (this.pageStatus) {
      case PageStatus.CONTACT: this.sendDetailsClick(); break;
      case PageStatus.FORGOT_PASSWORD: this.sendResetPasswordEmail(); break;
      case PageStatus.RESET_PASSWORD: this.resetPasswordClicked(); break;
      case PageStatus.FIRST_STEP: case PageStatus.SECOND_STEP: this.nextStep(); break;
    }
  }


  sendDetailsClick() {
    this.pageStatus = PageStatus.CONTACT_DONE;
  }

  nextStep() {
    this.pageStatus++;
  }

  doneClicked() {
    this.pageStatus = PageStatus.REGISTRATION_DONE;
  }

  async sendResetPasswordEmail() {
    await this.authService.sendResetPasswordEmail(this.email);
    this.pageStatus = PageStatus.RESET_PASSWORD_EMAIL_SENT;
  }

  async resetPasswordClicked() {
    if(this.password == this.passwordV)
      await this.authService.resetPassword(this.password);
  }


  // Check all required fields are filled and well formatted
  checkFields() : boolean {

    // Must enter business name
    if(this.inputToShow('businessName') && !this.businessName) {
      alert('יש להזין שם עסק');
      return false;
    }

    // Must enter name
    if(this.inputToShow('name') && !this.fullName) {
      alert('יש להזין שם מלא');
      return false;
    }

    // Must enter email
    if(this.inputToShow('email') && !this.email) {
      alert('יש להזין כתובת דוא"ל');
      return false;
    }

    // Check email is well formatted
    if(this.inputToShow('email') && !this.email.match(this.authService.EMAIL_REGEX)) {
      alert('כתובת דוא"ל אינה תקינה');
      return false;
    }

    // Check email is well formatted
    if(this.inputToShow('phone') && !+this.phone) {
      alert('מספר טלפון אינו תקין');
      return false;
    }


    // Check password is valid
    if(this.inputToShow('password') && (!this.password || !this.password.match(this.authService.PASSWORD_REGEX))) {
      alert('הסיסמה חייבת להכיל לפחות 6 תוים');
      return false;
    }

    // Check both password fields are identical
    if(this.inputToShow('passwordV') && this.password != this.passwordV) {
      alert('הסיסמה ואימות הסיסמא אינם זהים');
      return false;
    }

    return true;

  }

}
