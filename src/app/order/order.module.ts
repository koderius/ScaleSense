import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { orderPageRoutingModule } from './order-routing.module';

import { OrderPage } from './order-page.component';
import {ComponentsModule} from '../components/components.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    orderPageRoutingModule,
    ComponentsModule
  ],
  declarations: [OrderPage]
})
export class OrderPageModule {}
