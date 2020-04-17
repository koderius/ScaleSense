import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot, CanDeactivate} from '@angular/router';
import {OrderPage} from './order-page.component';
import {AlertsService} from '../services/alerts.service';

@Injectable({
  providedIn: 'root'
})
export class CloseOrderGuard implements CanDeactivate<OrderPage> {

  constructor(private alerts: AlertsService) {}

  async canDeactivate(
    component: OrderPage, currentRoute: ActivatedRouteSnapshot,
    currentState: RouterStateSnapshot,
    nextState?: RouterStateSnapshot): Promise<boolean>
  {

    // If the order has not been saved as a draft, or not yet sent to the supplier, alert on losing changes
    if(component.orderHasChanged() && !component.orderSent)
      return await this.alerts.areYouSure('האם לצאת?', 'השינויים לא נשמרו.');
    else
      return true;

  }
  
}
