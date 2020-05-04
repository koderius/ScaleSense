import { Pipe, PipeTransform } from '@angular/core';
import {OrderStatus} from '../models/OrderI';

@Pipe({
  name: 'orderStatusText'
})
export class OrderStatusTextPipe implements PipeTransform {

  transform(value: OrderStatus, ...args: any[]): string {
    switch (value) {
      case OrderStatus.DRAFT: return 'טיוטה';
      case OrderStatus.SENT: return 'נשלחה ולא נפתחה';
      case OrderStatus.OPENED: return 'הספק פתח - טרם אישר';
      case OrderStatus.APPROVED: return 'הספק אישר את ההזמנה';
      case OrderStatus.ON_THE_WAY: return 'הספק אישר סופית את ההזמנה';
      case OrderStatus.CANCELED_BY_SUPPLIER: return 'הספק ביטל את ההזמנה';
      case OrderStatus.CHANGED_BY_SUPPLIER: return 'הספק עשה שינויים בהזמנה';
      case OrderStatus.CANCELED_BY_CUSTOMER: return 'הלקוח ביטל את ההזמנה';
      case OrderStatus.CHANGED_BY_CUSTOMER: return 'הלקוח עשה שינויים בהזמנה';
    }
  }

}
