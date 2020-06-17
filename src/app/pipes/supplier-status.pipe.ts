import { Pipe, PipeTransform } from '@angular/core';
import {SupplierStatus} from '../models/Business';

@Pipe({
  name: 'supplierStatus'
})
export class SupplierStatusPipe implements PipeTransform {

  transform(value: SupplierStatus): any {
    switch (value) {
      case SupplierStatus.NOT_EXIST: default: return 'לא קיים';
      case SupplierStatus.INVITATION_WILL_BE_SENT: return 'תישלח הזמנה לאיש הקשר';
      case SupplierStatus.INVITATION_SENT: return 'הזמנה נשלחה';
      case SupplierStatus.ACTIVE: return 'פעיל';
    }
  }

}
