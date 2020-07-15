import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { WebsitePage } from './website-page.component';
import {FooterComponent} from './components/footer/footer.component';
import {WebsiteHeaderComponent} from './components/header/website-header.component';
import {RegisterPage} from './register/register.page';
import {MailService} from './mail/mail.service';
import {RecaptchaModule} from 'ng-recaptcha';
import {MatTooltipModule} from '@angular/material';
import {PaymentCompletePage} from './payment-complete/payment-complete.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild([
      {
        path: '',
        component: WebsitePage
      },
      {
        path: 'register/:id',
        component: RegisterPage
      },
      {
        path: 'register',
        redirectTo: 'register/0'
      },
      {
        path: 'payment-complete',
        component: PaymentCompletePage,
      },
    ]),
    RecaptchaModule.forRoot(),
    MatTooltipModule,
  ],
  declarations: [
    WebsitePage,
    RegisterPage,
    PaymentCompletePage,
    FooterComponent,
    WebsiteHeaderComponent,
  ],
  providers: [
    MailService,
  ],
})
export class WebsitePageModule {}
