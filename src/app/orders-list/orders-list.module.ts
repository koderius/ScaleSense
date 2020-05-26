import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { OrdersListPageRoutingModule } from './orders-list-routing.module';

import { OrdersListPage } from './orders-list.page';
import {ComponentsModule} from '../components/components.module';
import {OrderPageModule} from '../order/order.module';
import {OrderItemComponent} from '../components/order-item/order-item.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    OrdersListPageRoutingModule,
    ComponentsModule,
    OrderPageModule,
  ],
  declarations: [
    OrdersListPage,
    OrderItemComponent,
  ],
})
export class OrdersListPageModule {}
