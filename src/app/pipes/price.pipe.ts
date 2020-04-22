import { Pipe, PipeTransform } from '@angular/core';
import {formatNumber} from '@angular/common';
import {MetadataService} from '../services/metadata.service';

@Pipe({
  name: 'price'
})
export class PricePipe implements PipeTransform {

  transform(value: number, ...args: string[]): string {

    if(args.includes('vat'))
      value *= MetadataService.VAT;

    return (formatNumber(value, 'en-US', '1.2-2')) + MetadataService.COIN_SIGN;
  }

}
