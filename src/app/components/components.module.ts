import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {IonicModule} from '@ionic/angular';
import {HeaderComponent} from './header/header.component';
import {OredersWizardComponent} from './orders-wizard/oreders-wizard.component';
import {NgSelectComponent, NgSelectModule} from 'ng-custom-select';
import {HighlightifyPipe} from '../pipes/highlightify.pipe';
import {UnitAmountPipe} from '../pipes/unit-amount.pipe';
import {OrderStatusTextPipe} from '../pipes/order-status-text.pipe';
import {
  MatDatepickerModule,
  MatFormFieldModule,
  MatIconModule,
  MatInputModule,
  MatNativeDateModule
} from '@angular/material';
import {UserNamePipe} from '../pipes/user-name.pipe';
import {PricePipe} from '../pipes/price.pipe';
import {SelectPopoverDirective} from '../directives/select-popover.directive';
import {PaginationComponent} from './pagination/pagination.component';



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
    UnitAmountPipe,
    OrderStatusTextPipe,
    UserNamePipe,
    PricePipe,
    SelectPopoverDirective,
    PaginationComponent,
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
    UnitAmountPipe,
    OrderStatusTextPipe,
    UserNamePipe,
    PricePipe,
    SelectPopoverDirective,
    PaginationComponent,
  ],
})
export class ComponentsModule { }
