import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { OrdersListPage } from './orders-list.page';
import {OrderListGuard} from './order-list.guard';

const routes: Routes = [
  {
    path: '',
    component: OrdersListPage,
    canActivate: [OrderListGuard],
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class OrdersListPageRoutingModule {}
