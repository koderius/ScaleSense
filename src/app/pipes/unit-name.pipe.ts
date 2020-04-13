import { Pipe, PipeTransform } from '@angular/core';
import {ProductType} from '../models/Product';

@Pipe({
  name: 'unitName'
})
export class UnitNamePipe implements PipeTransform {

  transform(value: ProductType): string {

    switch (value) {
      case ProductType.BY_WEIGHT: default: return 'ק"ג';
      case ProductType.BOX: return 'ארגז';
      case ProductType.BLOCK: return 'בלוק';
      case ProductType.UNIT: return 'יחידה';
    }

  }

}
