import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivate, RouterStateSnapshot} from '@angular/router';
import {UsersService} from '../services/users.service';
import {UserPermission} from '../models/UserDoc';

/**
 * This guard check permission for entering an order for watch, edit, or create
 * */

@Injectable({
  providedIn: 'root'
})
export class OrderGuard implements CanActivate {

  constructor(private userService: UsersService) {}

  canActivate(routeSnapshot: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {

    // Check permission to edit
    if (routeSnapshot.queryParams['edit'])
      return this.userService.hasPermission(UserPermission.EDIT_ORDER);

    // Check permission to create order
    if (routeSnapshot.queryParams['draft'] || routeSnapshot.params['id'] == 'new')
      return this.userService.hasPermission(UserPermission.NEW_ORDER);

    // Check permission to watch
    return this.userService.hasPermission(UserPermission.ORDER_STATUS);

  }
  
}
