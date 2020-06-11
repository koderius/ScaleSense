import { Pipe, PipeTransform } from '@angular/core';
import {AuthService} from '../services/auth.service';

@Pipe({
  name: 'userName'
})
export class UserNamePipe implements PipeTransform {

  constructor(private authService: AuthService) {}

  async transform(uid: any, ...args: any[]) : Promise<any>{

    const user = await this.authService.getUserDoc(uid);
    return user ? user.displayName : '';

  }

}
