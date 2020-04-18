import { Pipe, PipeTransform } from '@angular/core';
import {ProductType} from '../models/Product';

@Pipe({
  name: 'unitName'
})
export class UnitNamePipe implements PipeTransform {

  transform(value: ProductType, ...args): string {

    const p = args[0] != 1;

    switch (value) {
      case ProductType.BY_WEIGHT: default: return 'ק"ג';
      case ProductType.BOX: return p ? 'ארגזים' : 'ארגז';
      case ProductType.BLOCK: return p ? 'בלוקים' : 'בלוק';
      case ProductType.UNIT: return p ? 'יחידות' : 'יחידה';
    }

  }

}
