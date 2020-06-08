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
    businessName?: string;
    orderId?: string;
    orderStatus?: OrderStatus;
    orderSerial?: string;
    productId?: string;
    productName?: string;
    adminData?: string;
    data?: any;
  }

}


export enum NotificationCode {

  // The other side made changes in an order
  ORDER_CHANGE = 1,

  // Server auto alert about an order
  ORDER_ALERT = 2,

  // The other side made changes in a product
  PRODUCT_CHANGE = 3,

  // The customer created a product return document
  PRODUCTS_RETURN = 4,

  //
  PRICE_OFFER = 5,
}


export interface AppNotification extends BaseNotificationDoc{

  /** Notification content text after translated from data */
  text?: string;

  /** List of UIDs that opened the notifications */
  readBy?: string[];

}


export interface ExternalNotification extends BaseNotificationDoc {

  text?: {
    appDomain?: string
    timeStr?: string;
    orderStatusStr?: string;
  }

}
