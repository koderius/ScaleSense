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
  MAT_DATE_LOCALE, MatAutocompleteModule, MatButtonModule,
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
import {AutocompleteFieldComponent} from './autocomplete-field/autocomplete-field.component';
import {CustomerPricingModalComponent} from '../customer-pricing-modal/customer-pricing-modal.component';
import {ManualWeightPopoverComponent} from '../manual-weight-popover/manual-weight-popover.component';
import {RoleNamePipe} from '../pipes/role-name.pipe';
import {PermissionNamePipe} from '../pipes/permission-name.pipe';
import {NotificationCodeNamePipe} from '../pipes/notification-code-name.pipe';
import {WeighService} from '../services/weigh.service';
import {SupplierLinkComponent} from './supplier-link/supplier-link.component';
import {SupplierStatusPipe} from '../pipes/supplier-status.pipe';
import {WeighProductOpenerService} from '../services/weigh-product-opener.service';
import {MobileMenuComponent} from './mobile-menu/mobile-menu.component';
import {ReportGeneratorModalComponent} from '../report-generator-modal/report-generator-modal.component';
import {PropertyNamePipe} from '../pipes/property-name.pipe';

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
    MatButtonModule,
  ],
  entryComponents: [
    ReturnGoodModalComponent,
    WeightModalComponent,
    WeightCameraComponent,
    CustomerPricingModalComponent,
    ManualWeightPopoverComponent,
    SupplierLinkComponent,
    ReportGeneratorModalComponent,
  ],
  declarations: [
    HeaderComponent,
    OredersWizardComponent,
    HighlightifyPipe,
    UnitAmountPipe,
    OrderStatusTextPipe,
    UserNamePipe,
    PricePipe,
    RoleNamePipe,
    PermissionNamePipe,
    NotificationCodeNamePipe,
    SupplierStatusPipe,
    SelectPopoverDirective,
    PaginationComponent,
    NotificationsTableComponent,
    SelectTextDirective,
    WeightModalComponent,
    WeightCameraComponent,
    ReturnGoodModalComponent,
    ReturnStatusTextPipe,
    AutocompleteFieldComponent,
    CustomerPricingModalComponent,
    ManualWeightPopoverComponent,
    SupplierLinkComponent,
    MobileMenuComponent,
    ReportGeneratorModalComponent,
    PropertyNamePipe,
  ],
  exports: [
    MatSelectModule,
    MatAutocompleteModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    HeaderComponent,
    OredersWizardComponent,
    NgSelectComponent,
    HighlightifyPipe,
    UnitAmountPipe,
    OrderStatusTextPipe,
    UserNamePipe,
    PricePipe,
    RoleNamePipe,
    PermissionNamePipe,
    NotificationCodeNamePipe,
    SupplierStatusPipe,
    SelectPopoverDirective,
    PaginationComponent,
    NotificationsTableComponent,
    SelectTextDirective,
    WeightCameraComponent,
    WeightModalComponent,
    ReturnGoodModalComponent,
    ReturnStatusTextPipe,
    AutocompleteFieldComponent,
    SupplierLinkComponent,
    MobileMenuComponent,
    ReportGeneratorModalComponent,
    PropertyNamePipe,
  ],
  providers: [
    // *Add services that call the entry components of this module
    WeighService,
    WeighProductOpenerService,
    { provide: MAT_DATE_LOCALE, useValue: 'en-GB' }   // Mat date format: dd/mm/yyyy
    // { provide: MAT_DATE_LOCALE, useValue: 'iw' }   // Mat date format: dd.mm.yyyy
  ]
})
export class ComponentsModule { }
