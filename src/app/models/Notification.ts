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
    data?: any;
  }

}


export enum NotificationCode {

  // The other side made changes in an order
  ORDER_CHANGE = 1,
  ORDER_CHANGE_NEW = 1.10,
  ORDER_CHANGE_OPENED = 1.20,
  ORDER_CHANGE_APPROVED = 1.30,
  ORDER_CHANGE_FINAL_APPROVED = 1.80,
  ORDER_CHANGE_CANCELLED = 1.400,

  // Server auto alert about an order
  ORDER_ALERT = 2,
  ORDER_ALERT_AFTER24 = 2.1,
  ORDER_ALERT_24BEFORE = 2.2,

  // The other side made changes in a product
  PRODUCT_CHANGE = 3,

  // The customer created a product return document
  PRODUCTS_RETURN = 4,

  //
  PRICE_OFFER = 5,
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
