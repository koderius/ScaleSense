import { Component, OnInit } from '@angular/core';
import {ProductPublicDoc} from '../models/ProductI';
import {IonInput, PopoverController} from '@ionic/angular';

@Component({
  selector: 'app-manual-weight-popover',
  templateUrl: './manual-weight-popover.component.html',
  styleUrls: ['./manual-weight-popover.component.scss'],
})
export class ManualWeightPopoverComponent implements OnInit {

  product: ProductPublicDoc;

  radioSelection: string;

  byWeight: boolean;
  amount: number;

  static NEW_WEIGHT = 'newAmount';
  static ORDER_AMOUNT = 'orderAmount';

  constructor(private popoverCtrl: PopoverController) { }

  ngOnInit() {}


  setInputFocus() {
    setTimeout(()=>{
      (document.getElementById('manualInput') as unknown as IonInput).setFocus();
    });
  }

  ok() {
    switch (this.radioSelection) {
      case 'accept':
        this.popoverCtrl.dismiss(null, ManualWeightPopoverComponent.ORDER_AMOUNT);
        break;
      case 'missing':
        this.popoverCtrl.dismiss(0, ManualWeightPopoverComponent.NEW_WEIGHT);
        break;
      case 'custom':

        if(!this.amount)
          this.amount = 0;

        let weight = this.amount;

        // If input was by unit (not by weight), convert to weight
        if(!this.byWeight)
          weight = this.amount * (this.product.unitWeight ? this.product.unitWeight : 1);

        this.popoverCtrl.dismiss(weight, ManualWeightPopoverComponent.NEW_WEIGHT);
        break;

    }
  }

}
