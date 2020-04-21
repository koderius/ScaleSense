import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {IonicModule} from '@ionic/angular';
import {HeaderComponent} from './header/header.component';
import {OredersWizardComponent} from './orders-wizard/oreders-wizard.component';
import {NgSelectComponent, NgSelectModule} from 'ng-custom-select';
import {HighlightifyPipe} from '../pipes/highlightify.pipe';
import {UnitNamePipe} from '../pipes/unit-name.pipe';
import {OrderStatusTextPipe} from '../pipes/order-status-text.pipe';
import {
  MatDatepickerModule,
  MatFormFieldModule,
  MatIconModule,
  MatInputModule,
  MatNativeDateModule
} from '@angular/material';
import {UserNamePipe} from '../pipes/user-name.pipe';
import {OrderChangePipe} from '../pipes/order-change.pipe';



@NgModule({
  imports: [
    CommonModule,
    IonicModule,
    NgSelectModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatInputModule,
    MatIconModule,
  ],
  declarations: [
    HeaderComponent,
    OredersWizardComponent,
    HighlightifyPipe,
    UnitNamePipe,
    OrderStatusTextPipe,
    UserNamePipe,
    OrderChangePipe,
  ],
  exports: [
    MatFormFieldModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatInputModule,
    MatIconModule,
    HeaderComponent,
    OredersWizardComponent,
    NgSelectComponent,
    HighlightifyPipe,
    UnitNamePipe,
    OrderStatusTextPipe,
    UserNamePipe,
    OrderChangePipe,
  ],
})
export class ComponentsModule { }
