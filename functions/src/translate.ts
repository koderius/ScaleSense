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
