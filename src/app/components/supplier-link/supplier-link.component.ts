import { Component, OnInit } from '@angular/core';
import {ModalController} from '@ionic/angular';
import {SupplierDoc, SupplierStatus} from '../../models/Business';
import {AuthService} from '../../services/auth.service';
import {SuppliersService} from '../../services/suppliers.service';
import {BusinessService} from '../../services/business.service';

@Component({
  selector: 'app-supplier-link',
  templateUrl: './supplier-link.component.html',
  styleUrls: ['./supplier-link.component.scss'],
})
export class SupplierLinkComponent implements OnInit {

  invitationAllow: boolean[] = [];

  matchList: SupplierDoc[] = [];

  supplierDoc: SupplierDoc;

  constructor(
    private modalCtrl: ModalController,
    private authService: AuthService,
    private supplierService: SuppliersService,
    private businessService: BusinessService,
  ) { }


  async ngOnInit() {

    // Use only contacts that has email
    this.supplierDoc.contacts = this.supplierDoc.contacts.filter((c)=>c.email);

    this.supplierDoc.contacts.forEach(async (contact)=>{
      // Find contact
      const user = await this.authService.getUserDoc(contact.email);
      // If the email is not connected to any user, it's possible to send this mail invitation
      if(!user)
        this.invitationAllow.push(true);
      // If the email is connected to a customer, cannot send invitation
      else if(user.side == 'c')
        this.invitationAllow.push(false);
      // If the email is connected to a supplier, can link to his business (add to list)
      else
        this.matchList.push(await this.businessService.getBusinessDoc('s', user.bid));
    });

    // Find all the suppliers that has this company ID, and add them to the list
    this.matchList.push(...await this.supplierService.searchSuppliersByCompanyId(this.supplierDoc));

  }


  async linkSupplier(selectedSupplier?: SupplierDoc, email?: string) {

    // Link to the selected supplier
    if(selectedSupplier) {

      // If the current supplier has some missing properties, get them from the selected supplier (including ID!)
      for(let p in selectedSupplier)
        if(!this.supplierDoc[p])
          this.supplierDoc[p] = selectedSupplier[p];

      // If the current supplier has extra contact available, get one of the selected supplier's contact (that is not in common)
      if(!this.supplierDoc.contacts[1] || !this.supplierDoc.contacts[1].name)
        this.supplierDoc.contacts[1] = selectedSupplier.contacts.find((c)=>c.email != this.supplierDoc.contacts[0].email && c.phone != this.supplierDoc.contacts[0])

      // If the supplier has already ID which is not the linked supplier ID, change it
      if(selectedSupplier.id != this.supplierDoc.id)
        await this.supplierService.changeMySupplierId(this.supplierDoc, selectedSupplier.id);

      // Dismiss as linked
      if(selectedSupplier.id == this.supplierDoc.id)
        this.modalCtrl.dismiss(null, 'linked');

    }

    // Dismiss with email address for invitation
    if(email)
      this.modalCtrl.dismiss(email, 'invitation');

  }

  cancel() {
    this.modalCtrl.dismiss();
  }

}
