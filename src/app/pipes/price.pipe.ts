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

    return (formatNumber(value, 'en-US', '1.2-2')) + MetadataService.COIN_SIGN;
  }

}
