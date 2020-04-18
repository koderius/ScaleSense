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

    // If order not exist, can leave the page
    if(!component.order)
      return true;

    let canLeave: boolean;

    // If the order has not been saved as a draft, or not yet sent to the supplier, alert on losing changes
    if(component.orderHasChanged() && !component.orderSent)
      canLeave = await this.alerts.areYouSure('האם לצאת?', 'השינויים לא נשמרו.');
    else
      canLeave = true;

    // If can leave the page, stop auto saving and remove the temporal order data
    if(canLeave) {
      clearInterval(component.autoSave);
      localStorage.removeItem(component.TEMP_DATA_KEY + component.order.id);
      localStorage.removeItem(component.TEMP_DATA_KEY + 'new'); // <- in case was new
    }

    return canLeave;

  }
  
}
