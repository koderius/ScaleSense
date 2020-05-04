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
  }


  // Select input text when focusing on it
  selectInput(ev) {
    ev.target.getElementsByTagName('input')[0].select();
  }

  inputValue() {
    return this.unitPipe.transform(this._amount, this.product.type);
  }

  onInputChange(ev) {
    this.amount = +ev.target.value.split(' ')[0];
  }

}
