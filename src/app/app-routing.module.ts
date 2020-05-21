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
    path: 'supplier',
    loadChildren: () => import('./supplier/supplier.module').then( m => m.SupplierPageModule),
    canActivateChild: [AppEnterGuard],
    data: {side: 's'}
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
    path: 'reception',
    loadChildren: () => import('./reception/reception.module').then( m => m.ReceptionPageModule),
    canActivateChild: [AppEnterGuard],
    data: {side: 'c'}
  },
  {
    path: 'returns-drafts',
    loadChildren: () => import('./returns-drafts/returns-drafts.module').then( m => m.ReturnsDraftsPageModule),
    canActivateChild: [AppEnterGuard],
    data: {side: 'c'}
  },


];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
