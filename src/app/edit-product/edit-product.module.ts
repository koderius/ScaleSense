import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { EditProductPageRoutingModule } from './edit-product-routing.module';

import { EditProductPage } from './edit-product.page';
import {ComponentsModule} from '../components/components.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    EditProductPageRoutingModule,
    ComponentsModule
  ],
  declarations: [EditProductPage]
})
export class EditProductPageModule {}
