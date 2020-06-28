import {Component, OnDestroy, OnInit} from '@angular/core';
import {ModalController} from '@ionic/angular';
import {Calculator} from '../utilities/Calculator';
import {AlertsService} from '../services/alerts.service';
import {WeighService} from '../services/weigh.service';
import {CameraService} from '../services/camera.service';
import {ProductOrder} from '../models/ProductI';
import {ProductsService} from '../services/products.service';

@Component({
  selector: 'app-weight-modal',
  templateUrl: './weight-modal.component.html',
  styleUrls: ['./weight-modal.component.scss'],
})
export class WeightModalComponent implements OnInit, OnDestroy {

  product: ProductOrder;
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
    private weighService: WeighService,
    private cameraService: CameraService,
    private productService: ProductsService,
  ) { }

  async ngOnInit() {

    // Maximum number of weighs will be the number of boxes received
    this.numOfBoxes = this.product.boxes || 1;

    // Get the tara of the product, if there is
    this.constTara = this.product.tara;
    this.isKnownTara = !!this.constTara;

    // Load the product's customer data for tolerance
    this.productWeightTolerance = ((await this.productService.extendWithCustomerData(this.product)).receiveWeightTolerance || 0) + '%';
  }


  async weighTara() {
    const res = await this.weighService.openWeightModal();
    if(res)
      this.tara = res;
  }

  async weighBruto() {
    const res = await this.weighService.openWeightModal();
    if(res)
      this.bruto = res;

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
    this.weighService.stopCamera();
  }

  get expectedNet() {
    return Calculator.ProductExpectedNetWeight(this.product);
  }


  get orderMatch() {
    return Calculator.IsTolerant(this.expectedNet, this.totalNetto, this.productWeightTolerance);
  }


  save() {
    this.product.finalWeight = this.totalNetto;
    this.product.isManualWeight = false;
    this.product.isWeightMatch = this.orderMatch;
    this.product.timeOfWeight = Date.now();
    this.modalCtrl.dismiss({data: this.product.finalWeight, role: 'ok'});
  }

  async close() {
    if((!this.totalNetto && !this.bruto) || await this.alerts.areYouSure('האם לבטל שקילה?'))
      this.modalCtrl.dismiss()
  }

  isStreamOn() : boolean {
    return !!this.cameraService.isCameraOn;
  }

  async stopCamera() {
    await this.weighService.stopCamera();
    alert('מצלמה כובתה');
  }

  ngOnDestroy(): void {
    this.weighService.stopCamera();
  }

}
