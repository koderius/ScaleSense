import { Component, OnInit } from '@angular/core';
import {ModalController} from '@ionic/angular';
import {ProductOrder} from '../models/OrderI';
import {FullProductDoc} from '../models/Product';
import {Calculator} from '../utilities/Calculator';
import {AlertsService} from '../services/alerts.service';
import {formatNumber} from '@angular/common';

@Component({
  selector: 'app-weight-modal',
  templateUrl: './weight-modal.component.html',
  styleUrls: ['./weight-modal.component.scss'],
})
export class WeightModalComponent implements OnInit {

  product: ProductOrder;
  productData: FullProductDoc;
  productWeightTolerance: string;

  tara: number;
  bruto: number;

  private _numOfBoxes: number;
  currentBox: number = 1;

  totalNetto: number = 0;
  done: boolean;

  get numOfBoxes() {
    return this._numOfBoxes;
  }

  set numOfBoxes(num: number) {
    if(num >= this.currentBox)
      this._numOfBoxes = num;
  }

  get netto() {
    return (this.bruto - this.tara) || 0;
  }

  get weightGap() {
    const expectedNetto = Calculator.ProductExpectedNetWeight(this.productData, this.product.amount);
    return formatNumber(Calculator.CalcError(expectedNetto, this.totalNetto * 100), 'en-US', '1.2-2') + '%';
  }

  get orderFit() {
    const expectedNetto = Calculator.ProductExpectedNetWeight(this.productData, this.product.amount);
    return Calculator.IsTolerant(expectedNetto, this.totalNetto, this.productWeightTolerance);
  }

  constructor(
    public modalCtrl: ModalController,
    private alerts: AlertsService,
  ) { }

  ngOnInit() {
    // Default tara is as in the product's data
    this.tara = this.productData.tara;
    // Default number of boxes is as in the order
    this.numOfBoxes = this.product.boxes || 1;

    this.productWeightTolerance = (this.productData.receiveWeightTolerance || 0) + '%';
  }


  weighTara() {
    this.tara = Math.random()*10;
  }

  weighBruto() {
    this.bruto = Math.random()*100;
    if(this.bruto < this.tara)
      this.weighBruto();
  }


  nextBox() {
    this.totalNetto += this.netto;
    this.bruto = this.tara = NaN;
    if(this.currentBox < this.numOfBoxes)
      this.currentBox++;
    else
      this.done = true;
  }


  save() {
    // Get the amount (no. of units) out of the weight, using the unit weight (If type of unit is Kg, keep the weight)
    this.product.finalAmount = this.totalNetto * (this.productData.type ? this.productData.unitWeight : 1);
    this.modalCtrl.dismiss({data: this.product.finalAmount, role: 'ok'});
  }

  async close() {
    if((!this.totalNetto && !this.bruto) || await this.alerts.areYouSure('האם לבטל שקילה?'))
      this.modalCtrl.dismiss()
  }

}
