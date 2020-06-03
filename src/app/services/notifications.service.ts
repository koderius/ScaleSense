import {Injectable} from '@angular/core';
import {BusinessService} from './business.service';
import {AuthSoftwareService} from './auth-software.service';
import {OrdersService} from './orders.service';
import {OrderStatusTextPipe} from '../pipes/order-status-text.pipe';
import * as firebase from 'firebase/app';
import 'firebase/firestore';
import {AppNotification, BaseNotificationDoc, NotificationCode} from '../models/Notification';
import {ProductsService} from './products.service';


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
    private productService: ProductsService,
    private statusText: OrderStatusTextPipe,
  ) {

    // Subscribe 5 last notifications
    this.notificationRef.orderBy('time', 'desc').limit(this.NOTES_PER_LOAD).onSnapshot((snapshot)=>{

      // Get last 5 notifications add keep adding new notification the to start of the array
      snapshot.docChanges()
        .filter((change)=>change.type == 'added')
        .map((change)=>change.doc)
        .forEach(async (doc)=>{
          await this.notificationParse(doc);
        });

      this.noMoreNotes = snapshot.docChanges().length < this.NOTES_PER_LOAD;

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
      await this.notificationParse(doc);
    });

    // Flag for no more notes
    this.noMoreNotes = res.docs.length < this.NOTES_PER_LOAD;

  }


  /** Set a notification as read (add the user to the list of users that have already read). Can mark also as unread */
  async markAsRead(notification: AppNotification, markAsUnread?: boolean) {

    const myUid = this.authService.currentUser.uid;
    // If the user is not in the readers list, add him
    if(!markAsUnread && !(notification.readBy || []).includes(myUid)) {
      await this.notificationRef.doc(notification.id).update({readBy: firebase.firestore.FieldValue.arrayUnion(myUid)});
      if(!notification.readBy)
        notification.readBy = [];
      notification.readBy.push(myUid);
    }
    // If the user is in the readers list, remover him
    if(markAsUnread && notification.readBy.includes(myUid)) {
      await this.notificationRef.doc(notification.id).update({readBy: firebase.firestore.FieldValue.arrayRemove(myUid)});
      const idx = notification.readBy.findIndex((r)=>r == myUid);
      notification.readBy.splice(idx);
    }

  }


  /** Check whether the given notification was read by the current user */
  isRead(notification: AppNotification) {
    return notification.readBy && notification.readBy.includes(this.authService.currentUser.uid);
  }


  /** Get the data out of the given notification and parse it for display */
  private async notificationParse(notificationDoc) {

    // Get notification document data & ID
    const newNotification: AppNotification = notificationDoc.data() as BaseNotificationDoc;
    newNotification.id = notificationDoc.id;

    // Get the business according to the base notification data
    const business = await this.businessService.getBusinessDoc(newNotification.refSide, newNotification.refBid);
    newNotification.businessName = business.name;


    // For notifications about order
    if(newNotification.code == NotificationCode.ORDER_CHANGE || newNotification.code == NotificationCode.ORDER_ALERT) {

      // Load the order data
      const order = await this.orderService.getOrderById(newNotification.content.orderId, false);
      newNotification.orderSerial = order.serial;

      switch (newNotification.content.adminData) {
        // Text for different alerts
        case 'nAfter24': newNotification.text = 'נשלחה לפני 24 שעות וטרם נפתחה'; break;
        case 'n24Before': newNotification.text = 'מועד אספקה מתקרב וטרם אושרה סופית'; break;
        // The text for order change will be the order's new status
        default: newNotification.text = this.statusText.transform(newNotification.content.orderStatus);
      }

    }


    // For notifications about products
    if(newNotification.code == NotificationCode.PRODUCT_CHANGE) {

      // It's not about order
      newNotification.orderSerial = '-';

      // Notification text
      switch (newNotification.content.adminData) {
        case 'c': newNotification.text = 'מוצר חדש: '; break;
        case 'u': newNotification.text = 'עדכון מוצר: '; break;
        case 'd': newNotification.text = 'מוצר הוסר: '; break;
      }
      // Add the product's name
      const product = await this.productService.getProduct(newNotification.content.productId);
      newNotification.text += product.name;

    }


    // For notification about products return
    if(newNotification.code == NotificationCode.PRODUCTS_RETURN) {

      // Can be from multiple orders
      newNotification.orderSerial = '-';
      newNotification.text = 'החזרת מוצר/ים מהלקוח';

    }


    if(newNotification.code == NotificationCode.PRICE_OFFER) {

      newNotification.orderSerial = '-';
      newNotification.text = 'ספק הציע מחיר חדש עבור המוצר: ';
      // Add the product's name
      const product = await this.productService.getProduct(newNotification.content.productId);
      newNotification.text += product.name;
    }


    // Push notification to the list, and make sure is sorted by time
    this._notifications.push(newNotification);
    this._notifications.sort((a, b) => b.time - a.time);

  }


  /** Delete the given notification for ALL USERS */
  async deleteNotification(noteId: string) {
    await this.notificationRef.doc(noteId).delete();
    const idx = this._notifications.findIndex((n)=>n.id == noteId);
    if(idx > -1)
      this._notifications.splice(idx,1);
  }

}
