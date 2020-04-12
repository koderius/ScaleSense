import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {ProductDoc} from '../../models/Product';

@Component({
  selector: 'app-product-to-cart',
  templateUrl: './product-to-cart.component.html',
  styleUrls: ['./product-to-cart.component.scss'],
})
export class ProductToCartComponent implements OnInit {

  private _amount = 0;

  @Input() product: ProductDoc;
  @Output() addToCart = new EventEmitter();

  constructor() { }

  ngOnInit() {}

  get amount() : number {
    return this._amount || 0;
  }

  @Input() set amount(amount: number) {
    if(!amount || amount <= 0)
      amount = 0;
    this._amount = amount;
  }

}
