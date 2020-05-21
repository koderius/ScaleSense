import { Component, OnInit } from '@angular/core';
import {ReturnService} from '../services/return.service';
import {ReturnDoc} from '../models/Return';
import {AlertsService} from '../services/alerts.service';
import {CustomersService} from '../services/customers.service';

@Component({
  selector: 'app-returns',
  templateUrl: './returns.page.html',
  styleUrls: ['./returns.page.scss'],
})
export class ReturnsPage implements OnInit {

  myReturns: ReturnDoc[] = [];

  constructor(
    private returnService: ReturnService,
    private alerts: AlertsService,
    private customersService: CustomersService,
  ) { }

  async ngOnInit() {

    // Load all supplier's last returns
    this.myReturns = await this.returnService.loadAllMyReturns();

  }




  async deleteReturn(returnDoc: ReturnDoc) {
    if(await this.alerts.areYouSure('האם למחוק מסמך החזרה?')) {
      await this.returnService.deleteReturn(returnDoc.id);
      // Refresh current page
      this.myReturns = await this.returnService.loadAllMyReturns(null, null, this.myReturns[0]);
    }
  }

  getCustomerById(cid: string) {
    return this.customersService.getCustomerById(cid);
  }

  async nextPage() {
    const res = await this.returnService.loadAllMyReturns(this.myReturns.slice(-1)[0]);
    // Only if there are results on the next page
    if(res.length)
      this.myReturns = res;
  }

  async prevPage() {
    this.myReturns = await this.returnService.loadAllMyReturns(this.myReturns[0]);
  }

}
