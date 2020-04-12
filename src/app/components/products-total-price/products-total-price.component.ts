import {Component, Input, OnInit} from '@angular/core';

@Component({
  selector: 'app-products-total-price',
  templateUrl: './products-total-price.component.html',
  styleUrls: ['./products-total-price.component.scss'],
})
export class ProductsTotalPriceComponent implements OnInit {

  @Input() price: number;
  @Input() pricePlusVat: number;

  constructor() { }

  ngOnInit() {}

}
