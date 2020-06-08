import { Pipe, PipeTransform } from '@angular/core';
import {OrderStatus, OrderStatusGroup} from '../models/OrderI';
import {BusinessService} from '../services/business.service';
import {DicOrderStatus} from '../../assets/dictionaries/orderStatus';
import {LangService} from '../services/lang.service';

/**
 * This pipe translate order's statuses for customer side and for supplier side using the status dictionary
 */

@Pipe({
  name: 'orderStatusText'
})
export class OrderStatusTextPipe implements PipeTransform {

  constructor(
    private businessService: BusinessService,
    private langService: LangService,
  ) {}

  transform(value: OrderStatus, groupName?: boolean): string {

    if(groupName) {
      const idx = OrderStatusGroup.findIndex((group)=>group.includes(value));
      return DicOrderStatus[this.langService.lang]['g'+idx] || '';
    }

    return DicOrderStatus[this.langService.lang][this.businessService.side + value] || '';

  }

}
