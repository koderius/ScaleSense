import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {IonicModule} from '@ionic/angular';
import {HeaderComponent} from './header/header.component';
import {OredersWizardComponent} from './orders-wizard/oreders-wizard.component';
import {NgSelectComponent, NgSelectModule} from 'ng-custom-select';
import {HighlightifyPipe} from '../pipes/highlightify.pipe';



@NgModule({
  imports: [
    CommonModule,
    IonicModule,
    NgSelectModule,
  ],
  declarations: [
    HeaderComponent,
    OredersWizardComponent,
    HighlightifyPipe
  ],
  exports: [
    HeaderComponent,
    OredersWizardComponent,
    NgSelectComponent,
    HighlightifyPipe,
  ]
})
export class ComponentsModule { }
