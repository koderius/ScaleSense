import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { UsersPageRoutingModule } from './users-routing.module';

import { UsersPage } from './users.page';
import {ComponentsModule} from '../components/components.module';
import {NewUserComponent} from './new-user/new-user.component';
import {UsersListComponent} from './users-list/users-list.component';
import {PermissionsListComponent} from './permissions-list/permissions-list.component';

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
    UsersListComponent,
    PermissionsListComponent,
  ]
})
export class UsersPageModule {}
