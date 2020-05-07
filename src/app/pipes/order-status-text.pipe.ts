import { Pipe, PipeTransform } from '@angular/core';
import {OrderStatus} from '../models/OrderI';

@Pipe({
  name: 'orderStatusText'
})
export class OrderStatusTextPipe implements PipeTransform {

  transform(value: OrderStatus, ...args: any[]): string {
    switch (value) {
      case OrderStatus.DRAFT: return 'טיוטה';
      case OrderStatus.SENT: case OrderStatus.EDITED: return 'טרם נפתחה';
      case OrderStatus.OPENED: return 'נפתחה וטרם אושרה';
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
