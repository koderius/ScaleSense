import { Component, OnInit } from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {BusinessDoc} from '../models/Business';
import {SuppliersService} from '../services/suppliers.service';
import {AlertsService} from '../services/alerts.service';

@Component({
  selector: 'app-edit-supplier',
  templateUrl: './edit-supplier.page.html',
  styleUrls: ['./edit-supplier.page.scss'],
})
export class EditSupplierPage implements OnInit {

  supplier: BusinessDoc;
  originalSupplier: string;

  constructor(
    private activatedRoute: ActivatedRoute,
    private suppliersService: SuppliersService,
    private alerts: AlertsService,
  ) { }

  ngOnInit() {

    // Create new supplier document or get existed one, according to the ID in the URL
    const id = this.activatedRoute.snapshot.params['id'];
    if(id == 'new') {
      this.supplier = {};
    }
    else {
      this.supplier = this.suppliersService.getSupplierById(id);
    }

    // Set one empty contact info, if no contact exist
    if(!this.supplier.contacts)
      this.supplier.contacts = [{}];

    // Save original data for checking changes
    this.originalSupplier = JSON.stringify(this.supplier);

  }

  get pageTitle() {
    if(this.supplier)
      return this.supplier.id ? 'עריכת ספק' : 'הקמת ספק חדש';
  }

  get temporalSerial() {
    return this.suppliersService.mySuppliers.length + 1;
  }

  async save() {

    if(!this.supplier.name) {
      alert('יש להזין שם ספק');
      return;
    }

    if(!this.supplier.companyId) {
      alert('יש להזין מספר ח.פ');
      return;
    }

    if(!this.supplier.companyId) {
      alert('יש להעלות תמונה');
      return;
    }

    const l = this.alerts.loaderStart('שומר פרטי ספק...');
    await this.suppliersService.saveSupplierDoc(this.supplier);
    this.alerts.loaderStop(l);

  }

}
