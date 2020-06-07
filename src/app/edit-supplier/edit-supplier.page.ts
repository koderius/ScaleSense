import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Route} from '@angular/router';
import {SupplierDoc} from '../models/Business';
import {SuppliersService} from '../services/suppliers.service';
import {AlertsService} from '../services/alerts.service';
import {FilesService} from '../services/files.service';
import {AuthSoftwareService} from '../services/auth-software.service';
import {NavigationService} from '../services/navigation.service';
import {BusinessService} from '../services/business.service';

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

  emailRegex = AuthSoftwareService.EMAIL_REGEX;

  myBusinessMode: boolean;

  constructor(
    private activatedRoute: ActivatedRoute,
    private suppliersService: SuppliersService,
    private alerts: AlertsService,
    private navService: NavigationService,
    private businessService: BusinessService,
  ) {}

  async ngOnInit() {

    // Create new supplier document or get existed one, according to the ID in the URL
    const id = this.activatedRoute.snapshot.params['id'];
    if(id == 'new')
      this.supplier = {};
    else
      this.supplier = await this.suppliersService.loadSupplier(id);

    // For editing current business
    if(id == 'edit' && window.location.pathname.endsWith('/my-business/edit')) {
      this.supplier = this.businessService.businessDoc;
      this.myBusinessMode = true;
    }

    // Go back if no supplier
    if(!this.supplier) {
      this.navService.goBack();
      return;
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
    if(this.supplier) {
      if(this.myBusinessMode)
        return 'עריכת פרטי עסק';
      else
        return this.supplier.id ? 'עריכת ספק' : 'הקמת ספק חדש';
    }
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


  checkFields() {

    // Get all inputs inside the form
    const inputs = document.querySelector('#forms').getElementsByTagName('input');

    // Check their validity
    for (let i = 0; i < inputs.length; i++)
      if(!inputs[i].validity.valid) {
        alert('יש למלא את כל השדות המסומנים ב-*');
        return false;
      }

    return true;

  }


  async save() {

    if(!this.checkFields())
      return;

    // Save my business data
    if(this.myBusinessMode) {
      const l = this.alerts.loaderStart('שומר פרטי עסק...');
      this.businessService.businessDocRef.update(this.supplier);
      this.alerts.loaderStop(l);
      alert('פרטי עסק נשמרו בהצלחה');
    }

    // Save the supplier
    else {
      const l = this.alerts.loaderStart('שומר פרטי ספק...');
      await this.suppliersService.saveSupplierDoc(this.supplier, this.tempLogo);
      this.alerts.loaderStop(l);
      alert('פרטי ספק נשמרו בהצלחה');
      this.navService.goToSuppliersList();
    }

  }

}
