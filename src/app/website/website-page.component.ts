import {AfterViewChecked, Component, ViewChild} from '@angular/core';
import {BusinessSide} from '../models/Business';
import {MailService} from './mail/mail.service';
import {MailForm} from './mail/MailForm';
import {AuthService} from '../services/auth.service';
import {NavigationService} from '../services/navigation.service';
import {take} from 'rxjs/operators';
import {ActivatedRoute} from '@angular/router';
import {TEXT_BOXES} from './TextBoxes';

@Component({
  selector: 'app-home',
  templateUrl: 'website-page.component.html',
  styleUrls: ['website-page.component.scss'],
})
export class WebsitePage implements AfterViewChecked {

  boxes = TEXT_BOXES;

  enterAs: BusinessSide;

  email: string;
  password: string;

  contact: MailForm = {};
  isSending: boolean;

  isLogin: boolean;

  constructor(
    private authService: AuthService,
    private navService: NavigationService,
    public mailService: MailService,
    private activatedRoute: ActivatedRoute,
  ) {}

  // Go to register page
  goToRegister() {
    this.navService.goToRegister();
  }

  // Go to register page in 'forgotPassword' stage
  goToResetPassword() {
    this.goToRegister();
    this.authService.forgotPassword();
  }

  goToApp() {
    this.navService.goToAppMain();
  }


  get currentUser() {
    return this.authService.currentUser;
  }


  async signout() {
    this.authService.signOut();
  }


  // Sign in and go to app main page (after document has loaded)
  async login() {
    if(this.email && this.password) {
      this.isLogin = true;
      if(await this.authService.signIn(this.email, this.password))
        this.authService.onCurrentUser.pipe(
          take(1)
        ).subscribe(()=>{
          this.navService.goToAppMain();
        });
      this.isLogin = false;
    }
  }


  checkContactFields() {

    // Check there is a name, content and email and/or phone number
    if(!(this.contact.name && this.contact.content && ((this.contact.email || '').match(AuthService.EMAIL_REGEX) || this.contact.phone))) {
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


  // Set boxes style according to the screen
  ngAfterViewChecked(): void {
    const gridStyle = window.getComputedStyle(document.getElementById('grid'));
    const numOfCols = gridStyle.getPropertyValue('grid-template-columns').split(' ').length;

    const boxes = document.getElementsByClassName('det-box');
    for (let i = 0; i < boxes.length; i++) {

      // Reset border radius
      boxes[i].getElementsByTagName('div')[0].style.borderRadius = '0';

      // Set border radius according to grid location
      // First cell
      if(i === 0)
        boxes[i].getElementsByTagName('div')[0].style.borderTopRightRadius = '3em';
      // First in column
      else if(i % numOfCols === 0)
        boxes[i].getElementsByTagName('div')[0].style.borderBottomRightRadius = '3em';
      // Last in column, or last in grid
      else if(i % numOfCols === numOfCols-1 || (i === boxes.length - 1))
        boxes[i].getElementsByTagName('div')[0].style.borderBottomLeftRadius = '3em';

    }
  }

}
