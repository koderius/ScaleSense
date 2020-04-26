import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { SuppliersListPageRoutingModule } from './suppliers-list-routing.module';

import { SuppliersListPage } from './suppliers-list.page';
import {ComponentsModule} from '../components/components.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    SuppliersListPageRoutingModule,
    ComponentsModule
  ],
  declarations: [SuppliersListPage]
})
export class SuppliersListPageModule {}
