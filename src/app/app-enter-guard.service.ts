import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot, CanActivateChild} from '@angular/router';
import {BusinessSide} from './models/Business';
import {AuthService} from './services/auth.service';

/** Guards for entering the customer and the supplier app */

@Injectable({
  providedIn: 'root'
})
export class AppEnterGuard implements CanActivateChild {

  constructor(private authService: AuthService) {}

  async canActivateChild(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean> {

    // The side that this page belong to, if not specified, opened for both
    const side = route.data ? route.data['side'] : null as BusinessSide;

    // If there is a connected user, check whether he is on the right side
    if(this.authService.currentUser)
      return side ? this.authService.currentUser.side == side : true;

    // Else, wait for user to be defined, and then check his side
    else
      return await new Promise<boolean>((resolve) => {
        const obs = this.authService.onUserReady.subscribe((user)=>{
          resolve(user && (side ? this.authService.currentUser.side == side : true));
          obs.unsubscribe();
        });
      });

  }
  
}
