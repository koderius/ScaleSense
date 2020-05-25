import { Pipe, PipeTransform } from '@angular/core';
import {formatNumber} from '@angular/common';
import {MetadataService} from '../services/metadata.service';

@Pipe({
  name: 'price'
})
export class PricePipe implements PipeTransform {

  transform(value: number, ...args: string[]): string {

    // Calc VAT
    if(args.includes('vat'))
      value *= MetadataService.VAT;

    // Show only coin sign, if no number
    if(!value && value !== 0)
      return MetadataService.COIN_SIGN;

    // Show currency with 2 digits after decimal point
    let numberStr = formatNumber(value, 'en-US', '1.2-2');

    // On right-to-left direction, transfer the minus sign form the start to the end
    if(numberStr.startsWith('-') && document.documentElement.dir == 'rtl')
      numberStr = numberStr.slice(1) + '-';

    // Add currency sign
    return numberStr + MetadataService.COIN_SIGN;

  }

}
