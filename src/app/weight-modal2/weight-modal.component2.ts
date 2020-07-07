import {Component, OnDestroy, OnInit} from '@angular/core';
import {ModalController} from '@ionic/angular';
import {Calculator} from '../utilities/Calculator';
import {AlertsService} from '../services/alerts.service';
import {WeighService} from '../services/weigh.service';
import {CameraService} from '../services/camera.service';
import {ProductOrder} from '../models/ProductI';
import {ProductsService} from '../services/products.service';

@Component({
  selector: 'app-weight-modal2',
  templateUrl: './weight-modal.component2.html',
  styleUrls: ['./weight-modal.component2.scss'],
})
export class WeightModalComponent2 implements OnInit, OnDestroy {

  product: ProductOrder;
  productWeightTolerance: string;

  method: 'fixedTara' | 'changedTara';

  tara: number;
  bruto: number;

  prevTara: number;

  totalWeight: number = 0;

  counter: number = 0;

  done: boolean;

  isReturn: boolean = true;

  /** If tara is known for all boxes, the maximum number of weights would be the total number of boxes for this product */
  get maxWeights() {
    if(this.method == 'fixedTara')
      return this.product.boxes;
    else
      return null;
  }


  /** Gap between current bruto and tara */
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

    // Get the tara of the product, if there is, and set the method according to its existence
    this.tara = this.product.tara || 0;
    this.method = this.tara ? 'fixedTara' : 'changedTara';

    // Load the product's customer data for tolerance
    this.productWeightTolerance = ((await this.productService.extendWithCustomerData(this.product)).receiveWeightTolerance || 0) + '%';
  }


  disabledTaraBtn() : boolean {

    // In fixed tara, tara can be defined only once, before weighs starts
    if(this.method == 'fixedTara')
      return !!this.counter;

    // In changing tara, tara cannot be scaled after both tara and bruto were already scaled
    else
      return !!(this.bruto && this.tara) || this.done;

  }


  disabledNextBtn() : boolean {
    // Cannot go to the next scale if reached max number of scales or bruto has not scaled yet or done clicked
    return this.maxWeights && this.counter >= this.maxWeights
    || !this.bruto
    || this.done;
  }


  /** Open scales modal for tara */
  async weighTara() {
    // Open weigh modal
    const res = await this.weighService.openWeightModal();

    if(!res)
      return;

    if(res < this.bruto || !this.bruto)
      this.tara = res;
    else {
      alert('משקל האריזה אינו יכול להיות גדול יותר מהמשקל הכולל (ברוטו)');
      return;
    }

  }


  /** Open scales modal for bruto */
  async weighBruto() {

    if(this.method == 'fixedTara' && !this.product.boxes) {
      alert('יש להזין את מספר ארגזים');
      return;
    }

    // Open weight modal
    const res = await this.weighService.openWeightModal();

    if(!res)
      return;

    if(res >= this.tara || !this.tara)
      this.bruto = res;
    else {
      alert('משקל כולל (ברוטו) אינו יכול להיות קטן יותר ממשקל האריזה');
      return;
    }

    this.counter++;

    // Auto done when all boxes were scaled
    if(this.method == 'fixedTara' && this.counter === this.maxWeights)
      this.doneProcess();

  }


  /** Add current weight and go to next scale */
  nextBox() {
    // Add the result net weight / bruto (according to the method) to the total weight
    this.totalWeight += (this.method == 'fixedTara' ? this.bruto : this.netto);
    // Reset the weight
    this.bruto = null;
    if(this.method == 'changedTara') {
      this.prevTara = this.tara;
      this.tara = null;
    }
  }


  /** Done all scales */
  doneProcess() {
    this.nextBox();

    if(this.method == 'fixedTara') {
      const totalTara = (this.tara * this.product.boxes) || 0;
      if(this.totalWeight >= totalTara)
        this.totalWeight -= totalTara;
      else {
        this.alerts.defaultAlert('משקל האריזות גדול יותר מהמשקל הכולל שנמדד', 'בדוק האם כל הארגזים נשקלו או שקול מחדש');
        return;
      }
    }

    this.done = true;
    // If in fixed tara mode, reduce the weight of the boxes from the total weight (else, keep the net weight)
    this.weighService.stopCamera();
  }


  /** Expected net weight according to the order amount */
  get expectedNet() : number {
    return Calculator.ProductExpectedNetWeight(this.product);
  }


  /** Is scales match the expected weight (within the tolerance) */
  get orderMatch() : boolean {
    return Calculator.IsTolerant(this.expectedNet, this.totalWeight, this.productWeightTolerance);
  }


  /** Save results in the product's details */
  save() {

    // Set the product with the weight details and dismiss
    if(!this.isReturn) {
      this.product.finalWeight = this.totalWeight;
      this.product.isManualWeight = false;
      this.product.isWeightMatch = this.orderMatch;
      this.product.timeOfWeight = Date.now();
    }
    else {
      if(this.totalWeight <= this.product.finalWeight)
        this.product.returnedWeight = this.totalWeight;
      else {
        alert('לא ניתן להחזיר כמות גדולה יותר מהכמות שהתקבלה');
        this.modalCtrl.dismiss();
      }
    }

    this.modalCtrl.dismiss(this.totalWeight, 'ok');
  }


  /** Close without save */
  async close() {
    if((!this.totalWeight && !this.bruto) || await this.alerts.areYouSure('האם לבטל שקילה?'))
      this.modalCtrl.dismiss()
  }


  /** Is camera working */
  isStreamOn() : boolean {
    return !!this.cameraService.isCameraOn;
  }


  /** Stop camera manually */
  async stopCameraBtn() {
    await this.weighService.stopCamera();
    alert('מצלמה כובתה');
  }


  /** Stop camera when scales are done */
  ngOnDestroy(): void {
    this.weighService.stopCamera();
  }

}
