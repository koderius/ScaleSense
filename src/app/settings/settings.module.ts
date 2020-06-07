import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { SettingsPageRoutingModule } from './settings-routing.module';

import { SettingsPage } from './settings-page.component';
import {ComponentsModule} from '../components/components.module';
import {NotificationsSettingsModalComponent} from './notifications-settings-modal/notifications-settings-modal.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    SettingsPageRoutingModule,
    ComponentsModule
  ],
  declarations: [SettingsPage, NotificationsSettingsModalComponent],
  entryComponents: [NotificationsSettingsModalComponent],
})
export class SettingsPageModule {}
