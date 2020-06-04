import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { EditSupplierPage } from './edit-supplier.page';

const routes: Routes = [
  {
    path: ':id',
    component: EditSupplierPage
  },
  {
    path: '',
    redirectTo: 'new'
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class EditSupplierPageRoutingModule {}
