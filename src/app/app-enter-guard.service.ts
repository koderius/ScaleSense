import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivateChild, RouterStateSnapshot} from '@angular/router';
import {BusinessSide} from './models/Business';
import {UserRole} from './models/UserDoc';
import {AuthService} from './services/auth.service';
import {take} from 'rxjs/operators';

/** Guards for entering the customer and the supplier app */

@Injectable({
  providedIn: 'root'
})
export class AppEnterGuard implements CanActivateChild {

  // The side that this page belong to, if not specified, opened for both
  side: BusinessSide;
  // The permissions that are required to enter this page
  permissions: string[];
  // Whether only the admin can enter the page
  adminOnly: boolean;

  constructor(private authService: AuthService) {}

  async canActivateChild(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean> {

    // Get parameters from route data, that describe the user requirements
    if(route.data) {
      this.side = route.data['side'];
      this.permissions = route.data['permissions'];
      this.adminOnly = route.data['adminOnly'];
    }

    // Get the user data, or wait auth is ready, and check user. (Stop subscription after one time)
    return await new Promise<boolean>(resolve => {
      this.authService.onCurrentUser.pipe(
        take(1)
      ).subscribe(()=>{
        resolve(this.checkUser());
      });
    });

  }


  // Check the current user pass all page's requirements. (Unsigned user will pass if there are no requirements)
  checkUser() {

    const user = this.authService.currentUser;

    // Check user is signed in
    if(!user)
      return false;

    // Check user's side - if needed
    if(this.side && user.side != this.side)
      return false;

    // Check user is admin - if needed
    if(this.adminOnly && user.role != UserRole.ADMIN)
      return false;

    // Check user's permissions - if needed
    if(this.permissions && this.permissions.length && this.permissions.some((p)=>!this.hasPermission(p)))
      return false;

    // If passed all
    return true;

  }


  hasPermission(p: string) {
    const userDoc = this.authService.currentUser;
    return userDoc.role == UserRole.ADMIN || (userDoc.permissions && userDoc.permissions[p]);
  }

}
