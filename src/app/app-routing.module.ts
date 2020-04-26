import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import {appEnterGuard} from './app-enter-guard.service';

const routes: Routes = [

  /** Website */
  {
    path: '',
    loadChildren: () => import('./website/website.module').then(m => m.WebsitePageModule)
  },

  {
    path: 'customer',
    loadChildren: () => import('./customer/customer.module').then( m => m.CustomerPageModule),
    canActivateChild: [appEnterGuard],
    data: {side: 'c'}
  },

  {
    path: 'order',
    loadChildren: () => import('./order/order.module').then(m => m.OrderPageModule),
    canActivateChild: [appEnterGuard],
  },

  {
    path: 'orders-list',
    loadChildren: () => import('./orders-list/orders-list.module').then( m => m.OrdersListPageModule),
    canActivateChild: [appEnterGuard],
  },

  {
    path: 'settings',
    loadChildren: () => import('./settings/settings.module').then(m => m.SettingsPageModule),
    canActivateChild: [appEnterGuard],
  },

];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
