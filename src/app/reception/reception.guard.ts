import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivate, RouterStateSnapshot} from '@angular/router';
import {UsersService} from '../services/users.service';
import {UserPermission} from '../models/UserDoc';
import {OrdersService} from '../services/orders.service';
import {Order} from '../models/Order';
import {OrderStatus} from '../models/OrderI';

@Injectable({
  providedIn: 'root'
})
export class ReceptionGuard implements CanActivate {

  constructor(
    private userService: UsersService,
    private orderService: OrdersService,
  ) {}

  async canActivate(routeSnapshot: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean> {

    // Has permission to receive order?
    if(!this.userService.hasPermission(UserPermission.ORDER_RECEIVE))
      return false;

    // Get order to check other permissions
    const orderId = routeSnapshot.params['id'];
    const order: Order = await this.orderService.getOrderById(orderId, false);

    // Check date permission
    const supplyDate = new Date(order.supplyTime);
    const today = new Date();
    if(supplyDate.toDateString() != today.toDateString() && supplyDate.getTime() > today.getTime() && !this.userService.hasPermission(UserPermission.ORDER_RECEIVE_EARLY)) {
      alert('אין הרשאה לקבלת סחורה לפני התאריך המיועד');
      return false;
    }

    // Check permission for order that has not been finally approved
    if(order.status < OrderStatus.FINAL_APPROVE  && !this.userService.hasPermission(UserPermission.ORDER_RECEIVE_UNAPPROVED)) {
      alert('אין הרשאה לקבלת סחורה אשר טרם אושרה סופית');
      return false;
    }

    // If passed all, can activate
    return true;

  }
  
}
