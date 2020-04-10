import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {IonicModule} from '@ionic/angular';
import {HeaderComponent} from './header/header.component';
import {OredersWizardComponent} from './orders-wizard/oreders-wizard.component';
import {NgSelectComponent, NgSelectModule} from 'ng-custom-select';



@NgModule({
  imports: [
    CommonModule,
    IonicModule,
    NgSelectModule,
  ],
  declarations: [
    HeaderComponent,
    OredersWizardComponent,
  ],
  exports: [
    HeaderComponent,
    OredersWizardComponent,
    NgSelectComponent,
  ]
})
export class ComponentsModule { }
