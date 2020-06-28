import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {ProductOrder} from '../../models/ProductI';
import {NavigationService} from '../../services/navigation.service';
import {UnitAmountPipe} from '../../pipes/unit-amount.pipe';
import {AlertsService} from '../../services/alerts.service';
import {ProductsService} from '../../services/products.service';
import {UsersService} from '../../services/users.service';
import {UserPermission} from '../../models/UserDoc';

@Component({
  selector: 'app-product-summery',
  templateUrl: './product-summery.component.html',
  styleUrls: ['./product-summery.component.scss'],
  providers: [UnitAmountPipe],
})
export class ProductSummeryComponent implements OnInit {

  @Input() productOrder: ProductOrder;
  @Input() editProduct: boolean;
  @Input() showComment: boolean;
  @Input() editComment: boolean;
  @Input() disabled: boolean;
  @Input() editBoxes: boolean;
  @Input() returnBtn: boolean;

  @Output() editClicked = new EventEmitter();
  @Output() doneEdit = new EventEmitter();
  @Output() clearClicked = new EventEmitter();
  @Output() returnBtnClicked = new EventEmitter();

  randomSkeletonWidth = (Math.random()*100) + '%';

  edit: boolean;
  tempPrice: number;
  tempAmount: number;

  constructor(
    public navService: NavigationService,
    private unitAmountPipe: UnitAmountPipe,
    private alertsService: AlertsService,
    private productService: ProductsService,
    private usersService: UsersService,
  ) { }

  get hasPermissionToChangePrice() {
    return this.usersService.hasPermission(UserPermission.PRODUCT_PRICE);
  }

  ngOnInit() {}

  async onEditClicked() {
    this.edit = true;
    this.tempAmount = this.productOrder.amount;
    this.tempPrice = this.productOrder.priceInOrder;
    this.editClicked.emit();
  }


  async onAcceptChange() {

    // Alert for minimum amount
    if(this.tempAmount < this.productOrder.orderMin) {
      alert(`מינימום הזמנה עבור ${this.productOrder.name}: ${this.unitAmountPipe.transform(this.productOrder.orderMin, this.productOrder.type)}`);
      return;
    }

    // Alert for changing price
    if(this.tempPrice != this.productOrder.priceInOrder && await this.alertsService.areYouSure('בוצע שינוי במחיר המוצר', 'האם לשנות את מחיר המוצר באופן קבוע או רק להזמנה זו?', 'באופן קבוע', 'להזמנה זו בלבד')) {
      this.productService.saveProduct({price: this.tempPrice}).then(()=>alert('מחיר מוצר התעדכן'));
    }

    this.productOrder.priceInOrder = this.tempPrice;
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
