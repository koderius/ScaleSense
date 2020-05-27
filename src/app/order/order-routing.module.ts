import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { OrderPage } from './order.page';
import {CloseOrderGuard} from './close-order-guard.service';
import {OrderGuard} from './order.guard';

const routes: Routes = [
  /**
   * Reservation page gets the order ID, and checks its status
   * If no ID was given, redirect to new order wizard
   */
  {
    path: ':id',
    component: OrderPage,
    canDeactivate: [CloseOrderGuard],
    canActivate: [OrderGuard],
  },
  {
    path: '',
    redirectTo: 'new',
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class orderPageRoutingModule {}
