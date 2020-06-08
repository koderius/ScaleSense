import {Pipe, PipeTransform} from '@angular/core';
import {NotificationCode} from '../models/Notification';

@Pipe({
  name: 'notificationCodeName'
})
export class NotificationCodeNamePipe implements PipeTransform {

  transform(value: NotificationCode): string {

    switch (+value) {

      case NotificationCode.ORDER_CHANGE: return 'סטטוס הזמנות';
      case NotificationCode.ORDER_ALERT: return 'התראות אוטומטיות';
      case NotificationCode.PRODUCT_CHANGE: return 'שינוי בפרטי מוצר';
      case NotificationCode.PRODUCTS_RETURN: return 'החזרת מוצר';
      case NotificationCode.PRICE_OFFER: return 'הצעת מחיר מספק';

      default: return ''+value;
    }

  }

}
