import {BusinessSide} from './Business';
import {OrderStatus} from './OrderI';

export interface BaseNotificationDoc {

  /** Server ID, after uploading to server */
  id?: string;

  /** Time of notification send */
  time: number;

  /** The type of notification */
  code: NotificationCode;

  /** Referenced business side */
  refSide?: BusinessSide,

  /** Referenced business ID */
  refBid?: string;

  /** Notification content data */
  content?: {
    orderId?: string;
    orderStatus?: OrderStatus;
    productId?: string;
    adminData?: string;
  }

}


export enum NotificationCode {
  ORDER_CHANGE = 1,
  ORDER_ALERT = 2,
  PRODUCT_CHANGE = 3,
}


export interface AppNotification extends BaseNotificationDoc{

  /** Business/Order/Product name after read from server according to the IDs in the base notification content */
  businessName?: string;
  orderSerial?: string;
  productName?: string;

  /** Notification content text after translated from data */
  text?: string;

  /** List of UIDs that opened the notifications */
  readBy?: string[];

}
