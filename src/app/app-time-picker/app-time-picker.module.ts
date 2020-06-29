import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {TimePickerPopover} from './time-picker-popover/time-picker-popover.component';
import {IonicModule} from '@ionic/angular';
import {TimePickerComponent} from './time-picker/time-picker.component';
import {FormsModule} from '@angular/forms';



@NgModule({
  declarations: [
    TimePickerPopover,
    TimePickerComponent,
  ],
  entryComponents: [
    TimePickerPopover,
    TimePickerComponent,
  ],
  exports: [
    TimePickerComponent,
  ],
  imports: [
    CommonModule,
    IonicModule,
    FormsModule,
  ],
})
export class AppTimePickerModule { }
