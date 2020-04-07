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

    alert('TO DO: Guard');
    return true;

  }
  
}
