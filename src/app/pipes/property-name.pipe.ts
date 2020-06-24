import { Pipe, PipeTransform } from '@angular/core';
import {LangService} from '../services/lang.service';
import {DicOrderFields} from '../../assets/dictionaries/orderFields';
import {DictionaryType} from '../../assets/dictionaries/DictionaryType';
import {DicBusinessFields} from '../../assets/dictionaries/businessFields';
import {DicProductFields} from '../../assets/dictionaries/productFields';

@Pipe({
  name: 'propertyName'
})
export class PropertyNamePipe implements PipeTransform {

  constructor(private langService: LangService) {}

  transform(value: any, objectName: string): string {

    // Get dictionary according to the object type
    let dict: DictionaryType;
    switch (objectName) {
      case 'order': dict = DicOrderFields; break;
      case 'business': dict = DicBusinessFields; break;
      case 'product': dict = DicProductFields; break;
      default: return value;
    }

    // Return the text
    return dict[this.langService.lang][value] || value;

  }

}
