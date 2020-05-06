import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {ProductOrder} from '../../models/OrderI';
import {ProductPublicDoc} from '../../models/Product';
import {IonInput} from '@ionic/angular';

@Component({
  selector: 'app-product-summery',
  templateUrl: './product-summery.component.html',
  styleUrls: ['./product-summery.component.scss'],
})
export class ProductSummeryComponent implements OnInit {

  @Input() productOrder: ProductOrder;
  @Input() productDetails: ProductPublicDoc;
  @Input() editProduct: boolean;
  @Input() showComment: boolean;
  @Input() editComment: boolean;

  @Output() editClicked = new EventEmitter();
  @Output() clearClicked = new EventEmitter();

  randomSkeletonWidth = (Math.random()*100) + '%';

  editAmount: boolean;

  constructor() { }

  ngOnInit() {}

  async onEditClicked(input: IonInput) {
    this.editAmount = true;
    await input.setFocus();
    (await input.getInputElement()).select();
    this.editClicked.emit();
  }

  onAmountChange($event) {
    const amount = $event.detail.value;
    if(amount > 0)
      this.productOrder.amount = amount;
  }

}
