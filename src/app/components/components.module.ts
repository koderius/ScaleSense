import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {IonicModule} from '@ionic/angular';
import {HeaderComponent} from './header/header.component';
import {OredersWizardComponent} from './orders-wizard/oreders-wizard.component';
import {NgSelectComponent, NgSelectModule} from 'ng-custom-select';
import {HighlightifyPipe} from '../pipes/highlightify.pipe';
import {UnitNamePipe} from '../pipes/unit-name.pipe';



@NgModule({
  imports: [
    CommonModule,
    IonicModule,
    NgSelectModule,
  ],
  declarations: [
    HeaderComponent,
    OredersWizardComponent,
    HighlightifyPipe,
    UnitNamePipe,
  ],
  exports: [
    HeaderComponent,
    OredersWizardComponent,
    NgSelectComponent,
    HighlightifyPipe,
    UnitNamePipe,
  ]
})
export class ComponentsModule { }
