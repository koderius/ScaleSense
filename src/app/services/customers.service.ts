import { Injectable } from '@angular/core';
import {BusinessService} from './business.service';
import {BusinessDoc} from '../models/Business';

@Injectable({
  providedIn: 'root'
})
export class CustomersService {

  private _myCustomers: BusinessDoc[] = [];

  constructor(private businessService: BusinessService) {

    // For suppliers only
    if(this.businessService.side != 's')
      return;

    // Subscribe supplier's list of customers - get data document of every customer
    this.businessService.businessDocRef.collection('my_customers').onSnapshot((snapshot)=>{
      snapshot.docChanges().forEach(async (d)=>{
        if(d.type == 'added') {
          const customerData = await this.businessService.getBusinessDoc('c', d.doc.id);
          this._myCustomers.push(customerData);
        }
      })
    });

  }

  get myCustomers() {
    return this._myCustomers.slice();
  }

  getCustomerById(cid: string) : BusinessDoc {
    return this.myCustomers.find((c)=>c.id == cid);
  }

  getCustomerByName(q: string) {
    q = q.toLowerCase();
    return this.myCustomers.filter((s)=>s.name.toLowerCase().startsWith(q));
  }

}
