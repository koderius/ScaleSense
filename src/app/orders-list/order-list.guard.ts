import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivate, RouterStateSnapshot} from '@angular/router';
import {UsersService} from '../services/users.service';
import {OrderActionMode} from '../components/order-item/order-item.component';
import {UserPermission} from '../models/UserDoc';

/**
 * This guard check whether the user has a permission to enter the orders list with the requested mode
 */

@Injectable({
  providedIn: 'root'
})
export class OrderListGuard implements CanActivate {

  constructor(private usersService: UsersService) {}

  canActivate(routeSnapshot: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {

    const mode: OrderActionMode = routeSnapshot.queryParams['mode'];

    switch (mode) {
      case 'drafts': return this.usersService.hasPermission(UserPermission.NEW_ORDER);
      case 'edit': return this.usersService.hasPermission(UserPermission.EDIT_ORDER);
      case 'receive': return this.usersService.hasPermission(UserPermission.ORDER_RECEIVE);
      case 'goods_return': return this.usersService.hasPermission(UserPermission.ORDER_RETURN);
      case 'view': default: return this.usersService.hasPermission(UserPermission.ORDER_STATUS);
    }

  }
  
}
