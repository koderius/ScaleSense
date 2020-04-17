import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { OrdersListPageRoutingModule } from './orders-list-routing.module';

import { OrdersListPage } from './orders-list.page';
import {ComponentsModule} from '../components/components.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    OrdersListPageRoutingModule,
    ComponentsModule,
  ],
  declarations: [OrdersListPage]
})
export class OrdersListPageModule {}
