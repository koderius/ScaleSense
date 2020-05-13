import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {ProductOrder} from '../../models/OrderI';
import {ProductPublicDoc} from '../../models/Product';
import {NavigationService} from '../../services/navigation.service';

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
  @Input() disabled: boolean;

  @Output() editClicked = new EventEmitter();
  @Output() doneEdit = new EventEmitter();
  @Output() clearClicked = new EventEmitter();

  randomSkeletonWidth = (Math.random()*100) + '%';

  edit: boolean;
  tempPrice: number;
  tempAmount: number;

  constructor(
    public navService: NavigationService,
  ) { }

  ngOnInit() {}

  async onEditClicked() {
    this.edit = true;
    this.tempAmount = this.productOrder.amount;
    this.tempPrice = this.productOrder.pricePerUnit;
    this.editClicked.emit();
  }

  onAcceptChange() {
    this.productOrder.pricePerUnit = this.tempPrice;
    this.productOrder.amount = this.tempAmount;
    this.edit = false;
    this.doneEdit.emit();
  }

  onCancelChange() {
    this.tempAmount = this.tempPrice = null;
    this.edit = false;
    this.doneEdit.emit();
  }

}
