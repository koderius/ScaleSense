import {Injectable} from '@angular/core';
import * as firebase from 'firebase/app';
import 'firebase/firestore';

type MailForm = {
  name?: string;
  email?: string;
  phone?: string;
  businessName?: string;
  details?: string;
}

@Injectable()
export class MailService {

  private readonly SUPPORT_MAIL = 'support@scale-sense.com';
  private readonly REGISTRATION_DOMAIN = 'localhost:8100/';

  private readonly mails = firebase.firestore().collection('mails');

  sendRegistrationMail(mail: MailForm) {

    const doc = this.mails.doc();
    doc.set({
      to: this.SUPPORT_MAIL,
      message: {
        subject: 'בקשה להרשמה ממשתמש חדש',
        html:
          '<p>משתמש שלח בקשה להרשמה למערכת.</p>' +
          '<p>פרטי משתמש:</p>' +
          '<ul>' +
          '   <li>שם: ' + mail.name + '</li>' +
          '   <li>שם העסק: ' + mail.businessName + '</li>' +
          '   <li>דוא"ל: ' + mail.email + '</li>' +
          '   <li>טלפון: ' + mail.phone + '</li>' +
          '   <li>מהות הפניה: ' + mail.details + '</li>' +
          '</ul>' +
          '<p>ניתן לקשר את הלקוח להרשמה למערכת בעזרת הקישור הבא:</p>' +
          '<p>'+this.REGISTRATION_DOMAIN+doc.id+'</p>',
      }
    })


  }

}
