import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {IonicModule} from '@ionic/angular';
import {HeaderComponent} from './header/header.component';
import {OredersWizardComponent} from './orders-wizard/oreders-wizard.component';



@NgModule({
  imports: [
    CommonModule,
    IonicModule,
  ],
  declarations: [
    HeaderComponent,
    OredersWizardComponent,
  ],
  exports: [
    HeaderComponent,
    OredersWizardComponent,
  ]
})
export class ComponentsModule { }
