import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {SettingsPage} from './settings-page.component';
import {UserPermission} from '../models/UserDoc';

const routes: Routes = [
  {
    path: '',
    component: SettingsPage
  },
  {
    path: 'suppliers-list',
    loadChildren: () => import('../suppliers-list/suppliers-list.module').then( m => m.SuppliersListPageModule),
    data: {side: 'c', permissions: [UserPermission.SETTINGS_SUPPLIERS]}
  },
  {
    path: 'edit-supplier',
    loadChildren: () => import('../edit-supplier/edit-supplier.module').then( m => m.EditSupplierPageModule),
    data: {side: 'c', permissions: [UserPermission.SETTINGS_SUPPLIERS]}
  },
  {
    path: 'products-list',
    loadChildren: () => import('../products-list/products-list.module').then( m => m.ProductsListPageModule),
    data: {permissions: [UserPermission.SETTINGS_PRODUCTS]}
  },
  {
    path: 'edit-product',
    loadChildren: () => import('../edit-product/edit-product.module').then( m => m.EditProductPageModule),
    data: {permissions: [UserPermission.SETTINGS_PRODUCTS]}
  },
  {
    path: 'categories-list',
    loadChildren: () => import('../categories-list/categories-list.module').then( m => m.CategoriesListPageModule),
    data: {side: 'c', permissions: [UserPermission.SETTINGS_CATEGORIES]}
  },
  {
    path: 'users',
    loadChildren: () => import('../users/users.module').then( m => m.UsersPageModule),
    data: {permissions: [UserPermission.MASTER]}
  },
  {
    path: 'my-business',
    loadChildren: () => import('../edit-supplier/edit-supplier.module').then( m => m.EditSupplierPageModule),
    data: {permissions: [UserPermission.MASTER]}
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SettingsPageRoutingModule {}
