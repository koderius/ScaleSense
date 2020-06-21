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
    path: 'app',
    redirectTo: '',
  },

  {
    path: 'app/customer',
    loadChildren: () => import('./customer/customer.module').then( m => m.CustomerPageModule),
    canActivateChild: [AppEnterGuard],
    data: {side: 'c'}
  },

  {
    path: 'app/supplier',
    loadChildren: () => import('./supplier/supplier.module').then( m => m.SupplierPageModule),
    canActivateChild: [AppEnterGuard],
    data: {side: 's'}
  },

  {
    path: 'app/order',
    loadChildren: () => import('./order/order.module').then(m => m.OrderPageModule),
    canActivateChild: [AppEnterGuard],
  },

  {
    path: 'app/orders-list',
    loadChildren: () => import('./orders-list/orders-list.module').then( m => m.OrdersListPageModule),
    canActivateChild: [AppEnterGuard],
  },

  {
    path: 'app/settings',
    loadChildren: () => import('./settings/settings.module').then(m => m.SettingsPageModule),
    canActivateChild: [AppEnterGuard],
  },
  {
    path: 'app/reception',
    loadChildren: () => import('./reception/reception.module').then( m => m.ReceptionPageModule),
    canActivateChild: [AppEnterGuard],
    data: {side: 'c'}
  },
  {
    path: 'app/returns-drafts',
    loadChildren: () => import('./returns-drafts/returns-drafts.module').then( m => m.ReturnsDraftsPageModule),
    canActivateChild: [AppEnterGuard],
    data: {side: 'c'}
  },
  {
    path: 'app/returns',
    loadChildren: () => import('./returns/returns.module').then( m => m.ReturnsPageModule),
    canActivateChild: [AppEnterGuard],
    data: {side: 's'}
  },




];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
