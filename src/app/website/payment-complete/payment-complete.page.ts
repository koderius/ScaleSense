import { Component, OnInit } from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {PaymentsService} from '../../services/payments.service';
import {AlertsService} from '../../services/alerts.service';

@Component({
  selector: 'app-payment-complete',
  templateUrl: './payment-complete.page.html',
  styleUrls: ['./payment-complete.page.scss'],
})
export class PaymentCompletePage implements OnInit {

  id: string;
  aCode: string;

  last4digit: string;
  amount: number;
  payments: number;

  bid: string;

  validUntil: Date;

  constructor(
    private activatedRoute: ActivatedRoute,
    private paymentsService: PaymentsService,
    private alerts: AlertsService,
  ) { }

  async ngOnInit() {

    const l = this.alerts.loaderStart('מאמת תשלום...');

    // Make sure payment is verified
    try {
      this.validUntil = await this.paymentsService.verifyPayment(window.location.search);
      this.alerts.loaderStop(l);
    }
    catch (e) {
      window.close();
      return;
    }

    // Get payments parameters
    const params = this.activatedRoute.snapshot.queryParams;
    this.id = params['Id'];
    this.aCode = params['ACode'];
    this.last4digit = params['L4digit'];
    this.amount = +params['Amount'];
    this.payments = +params['Payments'];
    this.bid = params['Order'];

  }

}
