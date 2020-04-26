import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { EditSupplierPageRoutingModule } from './edit-supplier-routing.module';

import { EditSupplierPage } from './edit-supplier.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    EditSupplierPageRoutingModule
  ],
  declarations: [EditSupplierPage]
})
export class EditSupplierPageModule {}
