import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ReturnsPageRoutingModule } from './returns-routing.module';

import { ReturnsPage } from './returns.page';
import {ComponentsModule} from '../components/components.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ReturnsPageRoutingModule,
    ComponentsModule
  ],
  declarations: [ReturnsPage]
})
export class ReturnsPageModule {}
