import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { EditProductPage } from './edit-product.page';

const routes: Routes = [
  {
    path: ':id',
    component: EditProductPage
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
export class EditProductPageRoutingModule {}
