import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ReportsGeneratorPageRoutingModule } from './reports-generator-routing.module';

import { ReportsGeneratorPage } from './reports-generator.page';
import {ComponentsModule} from '../components/components.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ReportsGeneratorPageRoutingModule,
    ComponentsModule,
  ],
  declarations: [ReportsGeneratorPage]
})
export class ReportsGeneratorPageModule {}
