import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { SettingsPage } from './settings-page.component';

const routes: Routes = [
  {
    path: '',
    component: SettingsPage
  },
  {
    path: 'suppliers-list',
    loadChildren: () => import('../suppliers-list/suppliers-list.module').then( m => m.SuppliersListPageModule),
    data: {side: 'c'}
  },
  {
    path: 'edit-supplier',
    loadChildren: () => import('../edit-supplier/edit-supplier.module').then( m => m.EditSupplierPageModule),
    data: {side: 'c'}
  },
  {
    path: 'products-list',
    loadChildren: () => import('../products-list/products-list.module').then( m => m.ProductsListPageModule),
  },
  {
    path: 'edit-product',
    loadChildren: () => import('../edit-product/edit-product.module').then( m => m.EditProductPageModule),
  },
  {
    path: 'categories-list',
    loadChildren: () => import('../categories-list/categories-list.module').then( m => m.CategoriesListPageModule),
    data: {side: 'c'}
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SettingsPageRoutingModule {}
