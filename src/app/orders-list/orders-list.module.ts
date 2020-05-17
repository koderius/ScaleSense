import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { OrdersListPageRoutingModule } from './orders-list-routing.module';

import { OrdersListPage } from './orders-list.page';
import {ComponentsModule} from '../components/components.module';
import {OrderPageModule} from '../order/order.module';
import {ReturnGoodModalComponent} from '../return-good-modal/return-good-modal.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    OrdersListPageRoutingModule,
    ComponentsModule,
    OrderPageModule,
  ],
  declarations: [OrdersListPage, ReturnGoodModalComponent],
  entryComponents: [ReturnGoodModalComponent],
})
export class OrdersListPageModule {}
