import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {ProductPublicDoc} from '../../models/Product';
import {UnitAmountPipe} from '../../pipes/unit-amount.pipe';

@Component({
  selector: 'app-product-to-cart',
  templateUrl: './product-to-cart.component.html',
  styleUrls: ['./product-to-cart.component.scss'],
  providers: [UnitAmountPipe]
})
export class ProductToCartComponent implements OnInit {

  private _amount = 0;

  showBubble: boolean;

  @Input() product: ProductPublicDoc;
  @Output() addToCart = new EventEmitter();

  constructor(private unitPipe: UnitAmountPipe) { }

  ngOnInit() {}

  get amount() : number {
    return this._amount || 0;
  }

  @Input() set amount(amount: number) {
    if(!amount || amount <= 0)
      amount = 0;
    this._amount = amount;
    this.addToCart.emit(this.amount);
  }


  inputValue() {
    return this.unitPipe.transform(this._amount, this.product.type);
  }

  onInputChange(ev) {
    this.amount = +ev.target.value.split(' ')[0];
  }

  setAmount(amount: number) {
    if(amount >= this.product.orderMin)
      this.addToCart.emit(amount);
    else
      alert(`מינימום הזמנה עבור ${this.product.name}: ${this.unitPipe.transform(this.product.orderMin, this.product.type)}`);
  }

}
