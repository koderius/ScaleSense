import { Pipe, PipeTransform } from '@angular/core';
import {ProductType} from '../models/ProductI';
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
      case ProductType.BY_WEIGHT: default: unitName = 'ק"ג'; break;
      case ProductType.BOX: unitName = p ? 'ארגזים' : 'ארגז'; break;
      case ProductType.BLOCK: unitName = p ? 'בלוקים' : 'בלוק'; break;
      case ProductType.UNIT: unitName = p ? 'יחידות' : 'יחידה'; break;
    }

    // Amount format - up to 3 digits after decimal point
    let numberStr = formatNumber(amount, 'en-US', '1.0-3');

    // On right-to-left direction, transfer the minus sign form the start to the end
    if(numberStr.startsWith('-') && document.documentElement.dir == 'rtl')
      numberStr = numberStr.slice(1) + '-';

    // Return the amount + the name of the unit. if null - only the name of the unit
    return amount !== null ? (numberStr + ' ' + unitName) : unitName;

  }

}
