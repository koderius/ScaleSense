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
  MAT_DATE_LOCALE, MatAutocompleteModule,
  MatDatepickerModule,
  MatFormFieldModule,
  MatIconModule,
  MatInputModule,
  MatNativeDateModule, MatSelectModule,
  MatTooltipModule,
} from '@angular/material';
import {UserNamePipe} from '../pipes/user-name.pipe';
import {PricePipe} from '../pipes/price.pipe';
import {SelectPopoverDirective} from '../directives/select-popover.directive';
import {PaginationComponent} from './pagination/pagination.component';
import {NotificationsTableComponent} from './notifications-table/notifications-table.component';
import {SelectTextDirective} from '../directives/select-text.directive';
import {WeightModalComponent} from '../weight-modal/weight-modal.component';
import {WeightCameraComponent} from '../weight-camera/weight-camera.component';
import {FormsModule} from '@angular/forms';
import {ReturnGoodModalComponent} from '../return-good-modal/return-good-modal.component';
import {ReturnStatusTextPipe} from '../pipes/return-status-text.pipe';

@NgModule({
  imports: [
    CommonModule,
    IonicModule,
    FormsModule,
    NgSelectModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatInputModule,
    MatIconModule,
    MatTooltipModule,
    MatSelectModule,
    MatAutocompleteModule,
  ],
  entryComponents: [
    ReturnGoodModalComponent,
    WeightModalComponent,
    WeightCameraComponent,
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
    NotificationsTableComponent,
    SelectTextDirective,
    WeightModalComponent,
    WeightCameraComponent,
    ReturnGoodModalComponent,
    ReturnStatusTextPipe,
  ],
  exports: [
    MatSelectModule,
    MatAutocompleteModule,
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
    NotificationsTableComponent,
    SelectTextDirective,
    WeightCameraComponent,
    WeightModalComponent,
    ReturnGoodModalComponent,
    ReturnStatusTextPipe,
  ],
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'en-GB' }   // Mat date format: dd/mm/yyyy
    // { provide: MAT_DATE_LOCALE, useValue: 'iw' }   // Mat date format: dd.mm.yyyy
  ]
})
export class ComponentsModule { }
