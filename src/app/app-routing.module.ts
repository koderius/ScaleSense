import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import {AppEnterGuard} from './app-enter-guard.service';

const routes: Routes = [

  /** Website */
  {
    path: '',
    loadChildren: () => import('./website/website.module').then(m => m.WebsitePageModule)
  },

  {
    path: 'customer',
    loadChildren: () => import('./customer/customer.module').then( m => m.CustomerPageModule),
    canActivateChild: [AppEnterGuard],
    data: {side: 'c'}
  },

  {
    path: 'order',
    loadChildren: () => import('./order/order.module').then(m => m.OrderPageModule),
    canActivateChild: [AppEnterGuard],
  },

  {
    path: 'orders-list',
    loadChildren: () => import('./orders-list/orders-list.module').then( m => m.OrdersListPageModule),
    canActivateChild: [AppEnterGuard],
  },

  {
    path: 'settings',
    loadChildren: () => import('./settings/settings.module').then(m => m.SettingsPageModule),
    canActivateChild: [AppEnterGuard],
  },
  {
    path: 'edit-supplier',
    loadChildren: () => import('./edit-supplier/edit-supplier.module').then( m => m.EditSupplierPageModule)
  },

];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
