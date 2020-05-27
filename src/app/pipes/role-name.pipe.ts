import { Pipe, PipeTransform } from '@angular/core';
import {UserRole} from '../models/UserDoc';

@Pipe({
  name: 'roleName'
})
export class RoleNamePipe implements PipeTransform {

  transform(value: UserRole): string {

    switch (value) {
      case UserRole.ADMIN: return 'מנהל ראשי';
      case UserRole.MANAGER: return 'מנהל משני';
      case UserRole.WORKER: return 'עובד';
    }

  }

}
