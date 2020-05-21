import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ReturnsDraftsPageRoutingModule } from './returns-drafts-routing.module';

import { ReturnsDraftsPage } from './returns-drafts.page';
import {ComponentsModule} from '../components/components.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ReturnsDraftsPageRoutingModule,
    ComponentsModule
  ],
  declarations: [ReturnsDraftsPage]
})
export class ReturnsDraftsPageModule {}
