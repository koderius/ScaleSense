import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, CanDeactivate} from '@angular/router';
import { Observable } from 'rxjs';
import {OrderPage} from './order-page.component';

@Injectable({
  providedIn: 'root'
})
export class CloseOrderGuard implements CanDeactivate<OrderPage> {
  canDeactivate(
    component: OrderPage, currentRoute: ActivatedRouteSnapshot,
    currentState: RouterStateSnapshot,
    nextState?: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree
  {

    if(component.orderHasChanged()) {
      // TODO: Ask quiting without saving
      alert('TO-DO: Ask quiting without saving');
      return false;
    }
    else
      return true;

  }
  
}
