import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';

@Component({
  selector: 'app-product-to-cart',
  templateUrl: './product-to-cart.component.html',
  styleUrls: ['./product-to-cart.component.scss'],
})
export class ProductToCartComponent implements OnInit {

  @Input() product;
  @Output() addToCart = new EventEmitter();

  constructor() { }

  ngOnInit() {}

}
