import {Pipe, PipeTransform} from '@angular/core';
import {NotificationCode} from '../models/Notification';

@Pipe({
  name: 'notificationCodeName'
})
export class NotificationCodeNamePipe implements PipeTransform {

  transform(value: NotificationCode): string {

    switch (value) {

      case NotificationCode.ORDER_CHANGE: return 'סטטוס הזמנות';
      case NotificationCode.ORDER_CHANGE_NEW: return 'הזמנה חדשה נשלחה';
      case NotificationCode.ORDER_CHANGE_OPENED: return 'פתיחת הזמנה ע"י הספק';
      case NotificationCode.ORDER_CHANGE_APPROVED: return 'אישור ראשוני';
      case NotificationCode.ORDER_CHANGE_FINAL_APPROVED: return 'אישור סופי';
      case NotificationCode.ORDER_CHANGE_CANCELLED: return 'ביטול הזמנה';

      case NotificationCode.ORDER_ALERT: return 'התראות אוטומטיות';
      case NotificationCode.ORDER_ALERT_24BEFORE: return 'הזמנה טרם אושרה סופית (24 שעות לפני)';
      case NotificationCode.ORDER_ALERT_AFTER24: return 'הזמנה לא נפתחה לאחר 24 שעות';

      default: return ''+value;
    }

  }

}
