import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { CustomerPage } from './customer.page';

const routes: Routes = [
  {
    path: '',
    component: CustomerPage
  },
  {
    path: 'order',
    loadChildren: () => import('../order/order.module').then(m => m.OrderPageModule)
  },
  {
    path: 'orders-list',
    loadChildren: () => import('../orders-list/orders-list.module').then( m => m.OrdersListPageModule)
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CustomerPageRoutingModule {}
