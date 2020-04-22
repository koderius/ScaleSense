import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot, CanActivateChild} from '@angular/router';
import {BusinessSide} from './models/Business';
import {AuthService} from './services/auth.service';

/** Guards for entering the customer and the supplier app */

@Injectable({
  providedIn: 'root'
})
export class appEnterGuard implements CanActivateChild {

  constructor(private authService: AuthService) {}

  async canActivateChild(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean> {

    // The side that this page belong to
    const side = route.data['side'] as BusinessSide;

    // If there is a connected user, check whether he is on the right side
    if(this.authService.currentUser)
      return this.authService.currentUser.side == side;

    // Else, wait for user to be defined, and then check his side
    else
      return await new Promise<boolean>((resolve) => {
        const obs = this.authService.onUserReady.subscribe((user)=>{
          resolve(user && this.authService.currentUser.side == side);
          obs.unsubscribe();
        });
      });

  }
  
}
