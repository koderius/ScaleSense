import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { EditSupplierPageRoutingModule } from './edit-supplier-routing.module';

import { EditSupplierPage } from './edit-supplier.page';
import {ComponentsModule} from '../components/components.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    EditSupplierPageRoutingModule,
    ComponentsModule,
    ReactiveFormsModule
  ],
  declarations: [EditSupplierPage]
})
export class EditSupplierPageModule {}
