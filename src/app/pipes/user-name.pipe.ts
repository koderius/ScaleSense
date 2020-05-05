import { Pipe, PipeTransform } from '@angular/core';
import {AuthSoftwareService} from '../services/auth-software.service';

@Pipe({
  name: 'userName'
})
export class UserNamePipe implements PipeTransform {

  constructor(private authService: AuthSoftwareService) {}

  async transform(uid: any, ...args: any[]) : Promise<any>{

    const user = await this.authService.getUserDoc(uid);
    return user ? user.displayName : '';

  }

}
