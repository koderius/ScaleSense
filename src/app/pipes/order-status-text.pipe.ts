import { Pipe, PipeTransform } from '@angular/core';
import {OrderStatus} from '../models/OrderI';

@Pipe({
  name: 'orderStatusText'
})
export class OrderStatusTextPipe implements PipeTransform {

  transform(value: OrderStatus, ...args: any[]): string {
    switch (value) {
      case OrderStatus.DRAFT: return 'טיוטה';
      case OrderStatus.SENT: return 'טרם נפתחה';
      case OrderStatus.OPENED: return 'נפתחה וטרם אושרה';
      case OrderStatus.APPROVED: return 'אישור ראשוני';
      case OrderStatus.ON_THE_WAY: return 'אושרה סופית';
      case OrderStatus.CANCELED_BY_SUPPLIER: return 'בוטלה ע"י הספק';
      case OrderStatus.CHANGED_BY_SUPPLIER: return 'הספק עשה שינויים בהזמנה';
      case OrderStatus.CANCELED_BY_CUSTOMER: return 'בוטלה ע"י הלקוח';
      case OrderStatus.CHANGED_BY_CUSTOMER: return 'הלקוח עשה שינויים בהזמנה';
    }
  }

}
