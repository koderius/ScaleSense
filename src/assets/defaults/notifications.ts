import {NotificationCode} from '../../app/models/Notification';
import {NotesSettings} from '../../app/models/Business';

export const DefaultNotificationsCustomer: NotesSettings = {
  [NotificationCode.ORDER_CHANGE]: {email: true, sms: true},
  [NotificationCode.ORDER_ALERT]: {email: true, sms: true},
  [NotificationCode.PRODUCT_CHANGE]: {email: true, sms: true},
  [NotificationCode.PRICE_OFFER]: {email: true, sms: true},
};

export const DefaultNotificationsSupplier: NotesSettings = {
  [NotificationCode.ORDER_CHANGE]: {email: true, sms: true},
  [NotificationCode.ORDER_ALERT]: {email: true, sms: true},
  [NotificationCode.PRODUCT_CHANGE]: {email: true, sms: true},
  [NotificationCode.PRODUCTS_RETURN]: {email: true, sms: true},
};
