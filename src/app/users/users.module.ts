import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { UsersPageRoutingModule } from './users-routing.module';

import { UsersPage } from './users.page';
import {ComponentsModule} from '../components/components.module';
import {NewUserComponent} from './components/new-user/new-user.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    UsersPageRoutingModule,
    ComponentsModule,
    ReactiveFormsModule
  ],
  declarations: [
    UsersPage,
    NewUserComponent,
  ]
})
export class UsersPageModule {}
