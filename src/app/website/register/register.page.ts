import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {NavController} from '@ionic/angular';
import {UserDoc} from '../../models/UserDoc';
import {MailService} from '../mail/mail.service';
import {MailForm} from '../mail/MailForm';
import {AuthService, AuthStage} from '../../services/auth.service';
import {BusinessService} from '../../services/business.service';

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

  readonly EmailRegex = AuthService.EMAIL_REGEX;

  constructor(
    private authService: AuthService,
    private activatedRoute: ActivatedRoute,
    private navCtrl: NavController,
    public mailService: MailService,
    private businessService: BusinessService,
  ) {}

  async ngOnInit() {

    // Entering the page in forgot password mode
    if(this.authService.authStage == AuthStage.FORGOT_PASSWORD) {
      this.pageStatus = PageStatus.FORGOT_PASSWORD;
      return;
    }

    // Entering the page with reset password link
    if(this.authService.authStage == AuthStage.RESET_PASSWORD) {
      this.pageStatus = PageStatus.RESET_PASSWORD;
      return;
    }

    // Get the ID from the URL
    this.id = this.activatedRoute.snapshot.params['id'];

    // For no ID, open contact form
    if(this.id === '0')
      this.pageStatus = PageStatus.CONTACT;

    // For ID, check if the it's a new business and start registration process
    else {

      this.businessName = await this.businessService.getNewCustomer(this.id);
      if(!this.businessName) {
        this.navCtrl.navigateRoot('site');
        return;
      }

      // If or when the user is signed in, go to the second page
      if(this.authService.currentUser)
        this.pageStatus = PageStatus.SECOND_STEP;
      else {
        this.pageStatus = PageStatus.FIRST_STEP;
        this.authService.onCurrentUser.subscribe(()=>{
          if(this.authService.currentUser)
            this.pageStatus = PageStatus.SECOND_STEP;
        });
      }

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

    if(!this.checkFields())
      return;

    switch (this.pageStatus) {
      case PageStatus.CONTACT: this.sendDetailsClick(); break;
      case PageStatus.FORGOT_PASSWORD: this.sendResetPasswordEmail(); break;
      case PageStatus.RESET_PASSWORD: this.resetPasswordClicked(); break;
      case PageStatus.FIRST_STEP: case PageStatus.SECOND_STEP: this.nextStep(); break;
    }

  }


  sendDetailsClick() {
    const mailContact: MailForm = {
      businessName: this.businessName,
      name: this.fullName,
      email: this.email,
      phone: this.phone,
      registrationReq: true,
    };
    if(this.mailService.sendRegistrationMail(mailContact))
      this.pageStatus = PageStatus.CONTACT_DONE;
    else
      alert('פנייה נכשלה');
  }

  nextStep() {
    this.pageStatus++;
  }

  doneClicked() {
    this.pageStatus = PageStatus.REGISTRATION_DONE;
  }

  async sendResetPasswordEmail() {
    await this.authService.sendPasswordResetEmail(this.email);
    this.pageStatus = PageStatus.RESET_PASSWORD_EMAIL_SENT;
  }

  async resetPasswordClicked() {
    if(this.password == this.passwordV)
      await this.authService.resetPasswordAndSignIn(this.password);
  }


  // Check all required fields are filled and well formatted
  checkFields() : boolean {

    const inputs = document.querySelector('.form').getElementsByTagName('input');
    for (let i = 0; i < inputs.length; i++) {
      if(inputs.item(i).validity.valueMissing) {
        alert('יש להזין את כל שדות החובה');
        return false;
      }
    }


    // Check email is well formatted
    if(this.inputToShow('email') && !this.email.match(this.EmailRegex)) {
      alert('כתובת דוא"ל אינה תקינה');
      return false;
    }

    // Check phone is well formatted
    if(this.inputToShow('phone') && !+this.phone) {
      alert('מספר טלפון אינו תקין');
      return false;
    }


    // Check password is valid
    if(this.inputToShow('password') && (!this.password || !this.password.match(AuthService.PASSWORD_REGEX))) {
      alert('הסיסמה חייבת להכיל לפחות 6 תוים');
      return false;
    }

    // Check both password fields are identical
    if(this.inputToShow('passwordV') && this.password != this.passwordV) {
      alert('הסיסמה ואימות הסיסמא אינם זהים');
      return false;
    }

    if(this.pageStatus == PageStatus.CONTACT && !this.mailService.recaptcha) {
      alert('יש לסמן את תיבת "אני לא רובוט"');
      return false;
    }

    return true;

  }

}
