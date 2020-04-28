import { Pipe, PipeTransform } from '@angular/core';
import {ProductType} from '../models/Product';
import {formatNumber} from '@angular/common';

@Pipe({
  name: 'unitAmount'
})
export class UnitAmountPipe implements PipeTransform {

  transform(amount: number, unit?: ProductType): string {

    // Is plural - 1 or null (no amount) will be displayed as single
    const p = (amount != 1 && amount !== null);

    // Set the name of the unit
    let unitName;
    switch (unit) {
      case ProductType.BY_WEIGHT: unitName = 'ק"ג'; break;
      case ProductType.BOX: unitName = p ? 'ארגזים' : 'ארגז'; break;
      case ProductType.BLOCK: unitName = p ? 'בלוקים' : 'בלוק'; break;
      case ProductType.UNIT: default: unitName = p ? 'יחידות' : 'יחידה'; break;
    }

    // Return the amount + the name of the unit. if null - only the name of the unit
    return amount !== null ? (formatNumber(amount, 'en-US', '1.0-3') + ' ' + unitName) : unitName;

  }

}
