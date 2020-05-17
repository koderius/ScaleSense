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

  tara: number = 0;
  constTara: number;
  bruto: number;

  numOfBoxes: number;

  totalNetto: number = 0;

  counter: number = 0;

  done: boolean;

  /** Whether the tara weight is known from the product's data */
  isKnownTara;


  get netto() {
    return (this.bruto - this.tara) || 0;
  }


  constructor(
    public modalCtrl: ModalController,
    private alerts: AlertsService,
  ) { }

  ngOnInit() {

    // Maximum number of weighs will be the number of boxes received
    this.numOfBoxes = this.product.boxes || 1;

    // Get the tara of the product, if there is
    this.constTara = this.productData.tara;
    this.isKnownTara = !!this.constTara;

    this.productWeightTolerance = (this.productData.receiveWeightTolerance || 0) + '%';
  }


  weighTara() {
    this.tara = Math.random()*10;
  }

  weighBruto() {
    this.bruto = Math.random()*50;
    if(this.bruto < this.tara)
      this.weighBruto();

    // For known tara, the number of weighs should not be more than the number of boxes
    if(this.isKnownTara)
      this.counter++;
  }


  nextBox() {
    // Add the result net weight
    this.totalNetto += this.netto;
    // Reset the bruto weight
    this.bruto = NaN;
  }

  doneProcess() {
    this.nextBox();
    this.done = true;
    // If in known tara mode, reduce the weight of the number of boxes from the total netto
    if(this.isKnownTara)
      this.totalNetto -= this.constTara * this.numOfBoxes;
  }

  get expectedNet() {
    return Calculator.ProductExpectedNetWeight(this.productData, this.product.amount);
  }


  get orderMatch() {
    return Calculator.IsTolerant(this.expectedNet, this.totalNetto, this.productWeightTolerance);
  }


  save() {
    // Get the amount (no. of units) out of the weight, using the unit weight (If type of unit is Kg, keep the weight)
    this.product.finalAmount = this.totalNetto / (this.productData.type ? this.productData.unitWeight : 1);
    this.product.isWeightMatch = this.orderMatch;
    this.modalCtrl.dismiss({data: this.product.finalAmount, role: 'ok'});
  }

  async close() {
    if((!this.totalNetto && !this.bruto) || await this.alerts.areYouSure('האם לבטל שקילה?'))
      this.modalCtrl.dismiss()
  }

}
