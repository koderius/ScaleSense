import { Pipe, PipeTransform } from '@angular/core';
import {ReturnStatus} from '../models/Return';

@Pipe({
  name: 'returnStatusText'
})
export class ReturnStatusTextPipe implements PipeTransform {

  transform(value: ReturnStatus): string {

    switch (value) {
      case ReturnStatus.TRASH: return 'אשפה';
      case ReturnStatus.REFUND: return 'זיכוי';
      case ReturnStatus.CHANGE: return 'החלפה';
    }

  }

}
