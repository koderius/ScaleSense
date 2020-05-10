import { Injectable } from '@angular/core';
import {BusinessService} from './business.service';
import {AuthSoftwareService} from './auth-software.service';
import {OrderChange} from '../models/OrderI';
import {OrdersService} from './orders.service';
import {OrderStatusTextPipe} from '../pipes/order-status-text.pipe';
import * as firebase from 'firebase/app';
import 'firebase/firestore';

export interface AppNotification extends OrderChange {
  id?: string;
  orderSerial?: string;
  businessName?: string;
  text?: string;
  readBy?: string[];
}


@Injectable({
  providedIn: 'root'
})
export class NotificationsService {

  private readonly notificationRef = this.businessService.businessDocRef.collection('my_notifications');

  private _notifications: AppNotification[] = [];

  private readonly NOTES_PER_LOAD = 5;

  noMoreNotes: boolean;

  get myNotifications() {
    return this._notifications.slice();
  }

  constructor(
    private businessService: BusinessService,
    private authService: AuthSoftwareService,
    private orderService: OrdersService,
    private statusText: OrderStatusTextPipe,
  ) {

    // Subscribe 5 last notifications
    this.notificationRef.orderBy('time', 'desc').limit(this.NOTES_PER_LOAD).onSnapshot((snapshot)=>{

      // Get last 5 notifications add keep adding new notification the to start of the array
      snapshot.docChanges()
        .filter((change)=>change.type == 'added')
        .map((change)=>change.doc)
        .reverse()
        .forEach(async (doc)=>{
          const newNote = await this.notificationParse(doc);
          this._notifications.unshift(newNote);
        });

      this.noMoreNotes = false;

    });

  }


  /** Load another 5 notification after the last one */
  async loadOlderNotifications() {

    // Last notification - for getting notifications after
    const lastNotification = this._notifications.slice(-1)[0];

    // If no notifications, cannot load more
    if(!lastNotification)
      return;

    // Get 5 last (by time) notification - after the last notification
    const res = await this.notificationRef.orderBy('time', 'desc')
      .startAfter(lastNotification.time)
      .limit(this.NOTES_PER_LOAD)
      .get();

    // Add them to the end of the array
    res.docs.reverse().forEach(async (doc)=>{
      const newNote = await this.notificationParse(doc);
      this._notifications.push(newNote);
    });

    // Flag for no more notes
    this.noMoreNotes = res.docs.length < this.NOTES_PER_LOAD;

  }


  /** Set a notification as read (add the user to the list of users that have already read) */
  async markAsRead(notification: AppNotification) {
    const myUid = this.authService.currentUser.uid;
    await this.notificationRef.doc(notification.id).update({readBy: firebase.firestore.FieldValue.arrayUnion(myUid)});
    if(!notification.readBy)
      notification.readBy = [];
    notification.readBy.push(myUid);
  }


  /** Check whether the given notification was read by the current user */
  isRead(notification: AppNotification) {
    return notification.readBy && notification.readBy.includes(this.authService.currentUser.uid);
  }


  /** Get the data out of the given notification */
  private async notificationParse(notificationDoc) {

    // Get notification document data & ID
    const newNotification: AppNotification = notificationDoc.data() as OrderChange;
    newNotification.id = notificationDoc.id;

    // For notifications about order changes
    if(newNotification.orderId) {

      // Load the order data
      const order = await this.orderService.getOrderById(newNotification.orderId, false);
      newNotification.orderSerial = order.serial;

      // Get the business according to the order SID/CID
      const business = await this.businessService.getBusinessDoc(this.businessService.otherSide, order[this.businessService.otherSide + 'id']);
      newNotification.businessName = business.name;

      switch (newNotification.adminCode) {
        case 'nAfter24': newNotification.text = 'נשלחה לפני 24 שעות וטרם נפתחה'; break;
        case 'n24Before': newNotification.text = 'מועד אספקה מתקרב וטרם אושרה סופית'; break;
        // No admin code, means it is a user change
        default: newNotification.text = this.statusText.transform(newNotification.status);
      }

    }

    return newNotification;

  }


  async deleteNotification(noteId: string) {
    await this.notificationRef.doc(noteId).delete();
    const idx = this._notifications.findIndex((n)=>n.id == noteId);
    if(idx > -1)
      this._notifications.splice(idx,1);
  }

}
