import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivateChild, RouterStateSnapshot} from '@angular/router';
import {BusinessSide} from './models/Business';
import {AuthSoftwareService} from './services/auth-software.service';
import {UserRole} from './models/UserDoc';

/** Guards for entering the customer and the supplier app */

@Injectable({
  providedIn: 'root'
})
export class AppEnterGuard implements CanActivateChild {

  constructor(
    private authService: AuthSoftwareService,
  ) {}

  async canActivateChild(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean> {

    // The side that this page belong to, if not specified, opened for both
    const side = route.data ? route.data['side'] : null as BusinessSide;
    const permissions = route.data ? route.data['permissions'] : null as string[];
    const adminOnly = route.data ? route.data['adminOnly'] : null as boolean;

    // If there is a connected user, check whether he is on the right side, and check his permissions
    if(this.authService.currentUser) {

      if(side && this.authService.currentUser.side != side)
        return false;

      if(adminOnly && this.authService.currentUser.role != UserRole.ADMIN)
        return false;

      if(permissions && permissions.length && permissions.some((p)=>!this.hasPermission(p)))
        return false;

      // If passed all
      return true;

    }

    // Else, wait for user to be defined, and then check his side
    else
      return await new Promise<boolean>((resolve) => {
        const obs = this.authService.onUserReady.subscribe((user)=>{
          resolve(user && (side ? this.authService.currentUser.side == side : true));
          obs.unsubscribe();
        });
      });

  }


  hasPermission(p: string) {
    const userDoc = this.authService.currentUser;
    return userDoc.role == UserRole.ADMIN || (userDoc.permissions && userDoc.permissions[p]);
  }

}
