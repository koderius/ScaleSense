import {Component, Input} from '@angular/core';

@Component({
  selector: 'app-products-total-price',
  templateUrl: './products-total-price.component.html',
  styleUrls: ['./products-total-price.component.scss'],
})
export class ProductsTotalPriceComponent {

  @Input() price: number;
  @Input() colSize: number;
  @Input() colPush: number;

  constructor() {}

}
