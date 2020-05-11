import {Injectable} from '@angular/core';
import {MailForm} from './MailForm';
import * as firebase from 'firebase/app';
import 'firebase/functions';

@Injectable()
export class MailService {

  private readonly SUPPORT_MAIL = 'mestroti@gmail.com'; //'support@scale-sense.com';
  private readonly REGISTRATION_DOMAIN = 'localhost:8100/';

  sendRegistrationMail(recaptcha: string, mailForm: MailForm) {

    const sendEmail = firebase.functions().httpsCallable('sendEmail');
    sendEmail({recaptcha: recaptcha, mailForm: mailForm});

  }

}
