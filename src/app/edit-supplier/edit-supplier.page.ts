import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {SupplierDoc, SupplierStatus} from '../models/Business';
import {SuppliersService} from '../services/suppliers.service';
import {AlertsService} from '../services/alerts.service';
import {FilesService} from '../services/files.service';
import {NavigationService} from '../services/navigation.service';
import {BusinessService} from '../services/business.service';
import {AuthService} from '../services/auth.service';
import {ModalController} from '@ionic/angular';
import {SupplierLinkComponent} from '../components/supplier-link/supplier-link.component';

@Component({
  selector: 'app-edit-supplier',
  templateUrl: './edit-supplier.page.html',
  styleUrls: ['./edit-supplier.page.scss'],
})
export class EditSupplierPage implements OnInit {

  SupplierStatus = SupplierStatus;
  invitationTo: string;

  supplier: SupplierDoc;
  originalSupplier: string;

  logoPreview: string;
  tempLogo: File;

  emailRegex = AuthService.EMAIL_REGEX;

  myBusinessMode: boolean;

  constructor(
    private activatedRoute: ActivatedRoute,
    private suppliersService: SuppliersService,
    private alerts: AlertsService,
    private navService: NavigationService,
    private businessService: BusinessService,
    private modalCtrl: ModalController,
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

  get statusColor() {
    switch (this.supplier.status) {
      case SupplierStatus.NOT_EXIST: default: return 'danger';
      case SupplierStatus.INVITATION_SENT: case SupplierStatus.INVITATION_WILL_BE_SENT: return 'warning';
      case SupplierStatus.ACTIVE: return 'success';
    }
  }

  get statusDesc() {
    switch (this.supplier.status) {
      case SupplierStatus.NOT_EXIST: default: return 'פרטי הספק שמורים\\ישמרו ברשימה שלך, אך לא מחוברים למשתמש פעיל בצד השני. יש להתחבר לספק קיים או לשלוח הזמנה לספק.';
      case SupplierStatus.INVITATION_WILL_BE_SENT: return `הזמנה לפתיחת חשבון ספק תישלח לכתובת: ${this.invitationTo} לאחת שמירת הפרטים`;
      case SupplierStatus.INVITATION_SENT: return 'נשלחה הזמנה ליצירת חשבון ספק. יש להמתין ליצירת החשבון על מנת שיהפוך לספק פעיל';
      case SupplierStatus.ACTIVE: return 'ספק פעיל. ניתן לבצע הזמנות ופעולות אחרות';
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
    for (let i = 0; i < inputs.length; i++) {
      if(inputs[i].validity.valueMissing) {
        alert('יש למלא את כל השדות המסומנים ב-*');
        return false;
      }
      if(inputs[i].validity.patternMismatch && inputs[i].type == 'email') {
        alert('כתובת דוא"ל לא תקינה');
        return false;
      }
      if(inputs[i].validity.patternMismatch && inputs[i].name == 'companyId') {
        alert('יש להזין מספר ח.פ תקין');
        return false;
      }
    }

    return true;

  }


  async save() {

    if(!this.checkFields())
      return;

    // Open the modal for link the supplier, if not linked
    if(!this.supplier.status && !await this.findSupplier())
      return;

    // Save my business data
    if(this.myBusinessMode) {
      const l = this.alerts.loaderStart('שומר פרטי עסק...');
      try {
        this.businessService.businessDocRef.update(this.supplier);
        alert('פרטי עסק נשמרו בהצלחה');
      }
      catch (e) {
        console.error(e);
      }
      this.alerts.loaderStop(l);
    }

    // Save the supplier
    else {

      const l = this.alerts.loaderStart('שומר פרטי ספק...');
      if(await this.suppliersService.saveSupplierDoc(this.supplier, this.tempLogo)) {
        alert('פרטי ספק נשמרו בהצלחה');
      }
      this.navService.goToSuppliersList();
      this.alerts.loaderStop(l);

      // Send invitation
      if(this.supplier.status == SupplierStatus.INVITATION_WILL_BE_SENT)
        this.suppliersService.sendSupplierInvitation(this.supplier, this.invitationTo);

    }

  }


  async findSupplier() : Promise<boolean> {
    const m = await this.modalCtrl.create({
      component: SupplierLinkComponent,
      componentProps: {supplierDoc: this.supplier},
      backdropDismiss: false,
      showBackdrop: true,
    });
    await m.present();
    const res = await m.onDidDismiss();
    if(res && res.role == 'linked') {
      this.supplier.status = SupplierStatus.ACTIVE;
      return true;
    }
    if(res && res.role == 'invitation') {
      this.invitationTo = res.data;
      this.supplier.status = SupplierStatus.INVITATION_WILL_BE_SENT;
      return true;
    }
  }

}
