import { Pipe, PipeTransform } from '@angular/core';
import {ProductType} from '../models/ProductI';
import {formatNumber} from '@angular/common';
import {DicUnits} from '../../assets/dictionaries/units';
import {LangService} from '../services/lang.service';

@Pipe({
  name: 'unitAmount'
})
export class UnitAmountPipe implements PipeTransform {

  constructor(private langService: LangService) {}

  transform(amount: number, unit: ProductType = 0): string {

    // Is plural - 1 or null (no amount) will be displayed as single
    const plural = (amount != 1 && amount !== null);

    const unitName = DicUnits[this.langService.lang]['u' + unit + (plural ? 'p' : '')];

    // Amount format - up to 3 digits after decimal point
    let numberStr = formatNumber(amount, 'en-US', '1.0-3');

    // On right-to-left direction, transfer the minus sign form the start to the end
    if(numberStr.startsWith('-') && document.documentElement.dir == 'rtl')
      numberStr = numberStr.slice(1) + '-';

    // Return the amount + the name of the unit. if null - only the name of the unit
    return amount !== null ? (numberStr + ' ' + unitName) : unitName;

  }

}
