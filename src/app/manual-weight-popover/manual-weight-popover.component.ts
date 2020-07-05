import { Component, OnInit } from '@angular/core';
import {ProductPublicDoc} from '../models/ProductI';
import {PopoverController} from '@ionic/angular';

@Component({
  selector: 'app-manual-weight-popover',
  templateUrl: './manual-weight-popover.component.html',
  styleUrls: ['./manual-weight-popover.component.scss'],
})
export class ManualWeightPopoverComponent implements OnInit {

  product: ProductPublicDoc;

  unit: 'unit' | 'weight' = 'weight';

  amount: number;

  showDet: boolean;

  static NEW_WEIGHT = 'newAmount';
  static ORDER_AMOUNT = 'orderAmount';

  constructor(private popoverCtrl: PopoverController) { }

  ngOnInit() {}


  acceptAmount() {
    this.popoverCtrl.dismiss(null, ManualWeightPopoverComponent.ORDER_AMOUNT);
  }


  missing() {
    this.popoverCtrl.dismiss(0, ManualWeightPopoverComponent.NEW_WEIGHT);
  }


  customAmount() {
    let weight = this.amount;
    if(!weight)
      return;
    // If input was by unit (not by weight), convert to weight
    if(this.unit == 'unit')
      weight = this.amount * (this.product.unitWeight ? this.product.unitWeight : 1);
    this.popoverCtrl.dismiss(weight, ManualWeightPopoverComponent.NEW_WEIGHT);
  }

}
