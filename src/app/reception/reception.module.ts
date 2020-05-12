import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ReceptionPageRoutingModule } from './reception-routing.module';

import { ReceptionPage } from './reception.page';
import {ComponentsModule} from '../components/components.module';
import {WeightModalComponent} from '../weight-modal/weight-modal.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ReceptionPageRoutingModule,
    ComponentsModule
  ],
  declarations: [ReceptionPage, WeightModalComponent],
  entryComponents: [WeightModalComponent],
})
export class ReceptionPageModule {}
