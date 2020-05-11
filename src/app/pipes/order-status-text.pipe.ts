import { Pipe, PipeTransform } from '@angular/core';
import {OrderStatus, OrderStatusGroup} from '../models/OrderI';
import {BusinessService} from '../services/business.service';

/**
 * This pipe translate order's statuses for customer side and for supplier side
 */

@Pipe({
  name: 'orderStatusText'
})
export class OrderStatusTextPipe implements PipeTransform {

  constructor(
    private businessService: BusinessService,
  ) {}

  transform(value: OrderStatus, groupName?: boolean): string {

    if(groupName) {
      const idx = OrderStatusGroup.findIndex((group)=>group.includes(value));
      switch (idx) {
        case 0: return 'פתוחה';
        case 1: return 'מאושרת סופית';
        case 2: return 'סגורה';
        case 3: return 'מבוטלת';
        default: return '';
      }
    }

    if(this.businessService.side == 'c') {

      switch (value) {
        case OrderStatus.DRAFT: return 'טיוטה';
        case OrderStatus.SENT: return 'נשלחה לספק';
        case OrderStatus.EDITED: return 'נשלחה לספק (נערכה)';
        case OrderStatus.OPENED: return 'נפתחה ע"י הספק וטרם אושרה';
        case OrderStatus.APPROVED: return 'אישור ראשוני';
        case OrderStatus.APPROVED_WITH_CHANGES: return 'אישור ראשוני עם שינויים';
        case OrderStatus.CHANGED: return 'נערכה ע"י הלקוח לאחר אישור ראשוני';
        case OrderStatus.FINAL_APPROVE: return 'אושרה סופית';
        case OrderStatus.FINAL_APPROVE_WITH_CHANGES: return 'אושרה סופית עם שינויים';
        case OrderStatus.CANCELED_BY_SUPPLIER: return 'בוטלה ע"י הספק';
        case OrderStatus.CANCELED_BY_CUSTOMER: return 'בוטלה ע"י הלקוח';
      }

    }

    if(this.businessService.side == 's') {

      switch (value) {
        case OrderStatus.SENT: case OrderStatus.EDITED: case OrderStatus.OPENED: return 'הזמנה חדשה';
        case OrderStatus.APPROVED: return 'אישור ראשוני';
        case OrderStatus.APPROVED_WITH_CHANGES: return 'אישור ראשוני עם שינויים';
        case OrderStatus.CHANGED: return 'שונתה ע"י הלקוח';
        case OrderStatus.FINAL_APPROVE: return 'אושרה סופית';
        case OrderStatus.FINAL_APPROVE_WITH_CHANGES: return 'אושרה סופית עם שינויים';
        case OrderStatus.CANCELED_BY_SUPPLIER: return 'בוטלה ע"י הספק';
        case OrderStatus.CANCELED_BY_CUSTOMER: return 'בוטלה ע"י הלקוח';
      }

    }
  }

}
