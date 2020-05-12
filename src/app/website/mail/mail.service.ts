import {Injectable} from '@angular/core';
import {MailForm} from './MailForm';
import * as firebase from 'firebase/app';
import 'firebase/functions';

@Injectable()
export class MailService {

  recaptcha: string;

  private readonly SUPPORT_MAIL = 'mestroti@gmail.com'; //'support@scale-sense.com';
  private readonly REGISTRATION_DOMAIN = 'localhost:8100/';

  async sendRegistrationMail(mailForm: MailForm) : Promise<boolean> {

    const sendEmail = firebase.functions().httpsCallable('sendEmail');
    try {
      await sendEmail({recaptcha: this.recaptcha, mailForm: mailForm});
      return true;
    }
    catch (e) {
      console.error(e);
      return false;
    }

  }

}
