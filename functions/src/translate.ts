import {BaseNotificationDoc, ExternalNotification} from '../../src/app/models/Notification';
import * as admin from 'firebase-admin';
import {DicOrderStatus} from '../../src/assets/dictionaries/orderStatus';
import {DicNotifications} from '../../src/assets/dictionaries/notificaions';

export const translateNoteContent = async (note: BaseNotificationDoc, lang: string) : Promise<ExternalNotification> => {

  // Extend the notification to have more text properties to display
  const extNote = note as ExternalNotification;

  // Get app domain
  const md = await admin.firestore().collection('metadata').doc('domain').get();
  extNote.text = {appDomain: md.get('main')};

  if(note.content) {

    // Add the string of the order status
    if(note.content.orderStatus) {
      // The side who gets the notification
      const side = note.refSide == 'c' ? 's' : 'c';
      extNote.text.orderStatusStr = DicOrderStatus[lang][side + note.content.orderStatus];
    }

    // Add admin data text
    if(note.content.adminData)
      extNote.text.noteText = DicNotifications[lang][note.content.adminData];

  }

  return extNote;

};

export const smsText = async (template: {data: any, name: string}) => {

  // Get the SMS template
  let temp = (await admin.firestore().collection('mailTemplates').doc(template.name).get()).get('sms') as string;

  // Replace all \\n with \n (Real new line instead of the way firestore keeps it)
  temp = temp.replace(/\\n/g,'\n');

  // Replace all variables names between {{ }} with their values according to the data
  let startIdx = temp.indexOf('{{');
  while (startIdx > -1) {

    const endIdx = temp.indexOf('}}');
    const varName = temp.slice(startIdx + 2, endIdx);
    const props = varName.split('.');
    let value = template.data;
    props.forEach((p)=>{
      value = value[p];
    });
    temp = temp.replace('{{' + varName + '}}', value);

    startIdx = temp.indexOf('{{');

  }

  return temp;

};
