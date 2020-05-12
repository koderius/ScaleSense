import { Component, OnInit } from '@angular/core';
import {ModalController} from '@ionic/angular';
import {ProductOrder} from '../models/OrderI';
import {FullProductDoc} from '../models/Product';
import {Calculator} from '../utilities/Calculator';

@Component({
  selector: 'app-weight-modal',
  templateUrl: './weight-modal.component.html',
  styleUrls: ['./weight-modal.component.scss'],
})
export class WeightModalComponent implements OnInit {

  product: ProductOrder;
  productData: FullProductDoc;

  tara: number;
  bruto: number;

  numOfBoxes: number = 1;

  get netto() {
    return (this.bruto - this.tara) || 0;
  }

  get orderFit() {
    const expectedNetto = Calculator.ProductExpectedNetWeight(this.productData, this.product.amount);
    return Calculator.IsTolerant(expectedNetto, this.netto, this.productData.weightTolerance + '%');
  }

  onBlur() {
    this.numOfBoxes = Math.floor(this.numOfBoxes);
    if(this.numOfBoxes < 0)
      this.numOfBoxes = 0;
  }

  constructor(
    public modalCtrl: ModalController,
  ) { }

  ngOnInit() {}


  save() {
    this.product.finalAmount = this.netto; //TODO
    this.modalCtrl.dismiss({data: this.product.finalAmount, role: 'ok'});
  }

}
