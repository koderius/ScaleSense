import { Pipe, PipeTransform } from '@angular/core';
import {UserPermission} from '../models/UserDoc';

@Pipe({
  name: 'permissionName'
})
export class PermissionNamePipe implements PipeTransform {

  transform(value: UserPermission): string {

    switch (value) {
      case UserPermission.EDIT_ORDER: return 'עריכת הזמנה';
      case UserPermission.MAIN_OFFICE: return 'משרד ראשי';
      case UserPermission.NEW_ORDER: return 'הזמנה חדשה';
      case UserPermission.ORDER_RECEIVE: return 'קבלת סחורה';
      case UserPermission.ORDER_RECEIVE_EARLY: return 'קבלת סחורה לפני התאריך';
      case UserPermission.ORDER_RECEIVE_NO_WEIGHT: return 'קבלת סחורה ללא שקילה';
      case UserPermission.ORDER_RECEIVE_UNAPPROVED: return 'קבלת סחורה לפני אישור סופי';
      case UserPermission.ORDER_RETURN: return 'החזרת סחורה';
      case UserPermission.ORDER_STATUS: return 'סטטוס הזמנות';
      case UserPermission.PRODUCT_PRICE: return 'עריכת מחיר מוצר בהזמנה';
      case UserPermission.REPORTS: return 'דו"חות';
      case UserPermission.SETTINGS_CATEGORIES: return 'עריכת קטגוריות';
      case UserPermission.SETTINGS_EQUIPMENT: return 'הגדרות ציוד';
      case UserPermission.SETTINGS_GENERAL: return 'הגדרות כלליות';
      case UserPermission.SETTINGS_PRODUCTS: return 'עריכת מוצרים';
      case UserPermission.SETTINGS_SUPPLIERS: return 'עריכת ספקים';
      case UserPermission.STOCK: return 'מלאי';
      case UserPermission.USE_SCALES: return 'שקילה';
      // If name is missing
      default: return value;
    }

  }

}
