import { Component, OnInit } from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {BusinessDoc, SupplierDoc} from '../models/Business';
import {SuppliersService} from '../services/suppliers.service';
import {AlertsService} from '../services/alerts.service';
import {FilesService} from '../services/files.service';
import {AuthSoftwareService} from '../services/auth-software.service';
import {NavigationService} from '../services/navigation.service';

@Component({
  selector: 'app-edit-supplier',
  templateUrl: './edit-supplier.page.html',
  styleUrls: ['./edit-supplier.page.scss'],
})
export class EditSupplierPage implements OnInit {

  supplier: SupplierDoc;
  originalSupplier: string;

  logoPreview: string;
  tempLogo: File;

  constructor(
    private activatedRoute: ActivatedRoute,
    private suppliersService: SuppliersService,
    private alerts: AlertsService,
    private navService: NavigationService,
  ) { }

  async ngOnInit() {

    // Create new supplier document or get existed one, according to the ID in the URL
    const id = this.activatedRoute.snapshot.params['id'];
    if(id == 'new') {
      this.supplier = {};
    }
    else {
      this.supplier = await this.suppliersService.loadSupplier(id);
    }

    // Set one empty contact info, if no contact exist
    if(!this.supplier.contacts)
      this.supplier.contacts = [{}];

    // Save original data for checking changes
    this.originalSupplier = JSON.stringify(this.supplier);

    // Show the logo image
    this.logoPreview = this.supplier.logo;

  }

  get pageTitle() {
    if(this.supplier)
      return this.supplier.id ? 'עריכת ספק' : 'הקמת ספק חדש';
  }

  get temporalSerial() {
    return this.suppliersService.mySuppliers.length + 1;
  }


  async chooseLogo(file: File) {
    this.tempLogo = file;
    this.logoPreview = await FilesService.ReadFile(file);
  }

  clearLogo() {
    this.logoPreview = null;
    this.tempLogo = null;
    this.supplier.logo = null;
  }

  async enterLink() {
    this.supplier.logo = this.logoPreview = await this.alerts.inputAlert('', 'הדבק קישור לתמונה');
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

    // TODO: Is it really required?
    if(!this.logoPreview) {
      alert('יש להעלות תמונה');
      return;
    }

    if(!this.supplier.contacts[0].name || !this.supplier.contacts[0].email || !this.supplier.contacts[0].phone) {
      alert('יש להזין פרטי איש קשר אחד לפחות');
      return;
    }

    if(!(this.supplier.contacts[0].email || '').match(AuthSoftwareService.EMAIL_REGEX)) {
      alert('כתובת אימייל לא תקינה');
      return;
    }

    if(this.supplier.contacts[1] && !this.supplier.contacts[1].email.match(AuthSoftwareService.EMAIL_REGEX)) {
      alert('כתובת אימייל של איש קשר נוסף לא תקינה');
      return;
    }

    // Save the supplier. If there is a temporary file, upload it. If the supplier has a logo but it was clear, delete the logo from server
    const l = this.alerts.loaderStart('שומר פרטי ספק...');
    await this.suppliersService.saveSupplierDoc(this.supplier, this.tempLogo);
    this.alerts.loaderStop(l);
    alert('פרטי ספק נשמרו בהצלחה');
    this.navService.goToSuppliersList();

  }

}
