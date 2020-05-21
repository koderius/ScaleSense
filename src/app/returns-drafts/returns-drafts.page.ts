import { Component, OnInit } from '@angular/core';
import {SuppliersService} from '../services/suppliers.service';
import {ReturnDoc} from '../models/Return';
import {ReturnService} from '../services/return.service';
import {ModalController} from '@ionic/angular';
import {ReturnGoodModalComponent} from '../return-good-modal/return-good-modal.component';
import {AlertsService} from '../services/alerts.service';
import {__await} from 'tslib';

@Component({
  selector: 'app-returns-drafts',
  templateUrl: './returns-drafts.page.html',
  styleUrls: ['./returns-drafts.page.scss'],
})
export class ReturnsDraftsPage implements OnInit {

  supplierQuery: string = '';
  query: string;

  drafts: ReturnDoc[] = [];

  get suppliers() {
    return (this.suppliersService.mySuppliers || []).filter((s)=>s.name.startsWith(this.supplierQuery));
  }

  constructor(
    public returnsService: ReturnService,
    private suppliersService: SuppliersService,
    private modalService: ModalController,
    private alerts: AlertsService,
  ) { }

  ngOnInit() {
  }

  async search() {

    // Get the selected supplier
    const supplier = this.suppliersService.mySuppliers.find((s)=>s.name == this.supplierQuery);

    // If there is a valid supplier or no supplier selected, continue querying
    if(supplier || (!this.supplierQuery && this.query))
      this.drafts = await this.returnsService.queryDrafts(supplier ? supplier.id : null, this.query);
    else
      this.drafts = [];

    this.returnsService.clearList();

  }

  getSupplierById(id: string) {
    return this.suppliersService.getSupplierById(id);
  }

  async openDraft(returnDoc: ReturnDoc) {
    const m = await this.modalService.create({
      component: ReturnGoodModalComponent,
      componentProps: {returnDoc: returnDoc},
      backdropDismiss: false,
      cssClass: 'wide-modal',
    });
    m.present();
  }

  async deleteDraft(returnDoc: ReturnDoc) {
    if(await this.alerts.areYouSure('האם למחוק טיוטת החזרה?')) {
      await this.returnsService.deleteDraft(returnDoc.id);
      this.search();
    }
  }

  onChecked(returnDoc: ReturnDoc ,ev) {

    if(ev.detail.checked)
      this.returnsService.addDoc(returnDoc, true);
    else
      this.returnsService.removeFromList(returnDoc.id);

  }

  onCheckAll(ev) {

    setTimeout(()=>{
      if(ev.target.checked)
        this.drafts.forEach((d)=>{
          this.returnsService.addDoc(d);
        });
      else
        this.returnsService.clearList();
    });

  }

  async sendToSupplier() {
    const l = this.alerts.loaderStart('שולח...');
    await this.returnsService.sendListToSupplier();
    this.alerts.loaderStop(l);
    this.search();
  }

}
