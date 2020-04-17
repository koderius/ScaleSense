import {Component, Input, OnInit} from '@angular/core';
import {VatCalcPipe} from '../../pipes/vat-calc.pipe';

@Component({
  selector: 'app-products-total-price',
  templateUrl: './products-total-price.component.html',
  styleUrls: ['./products-total-price.component.scss'],
  providers: [VatCalcPipe],
})
export class ProductsTotalPriceComponent implements OnInit {

  @Input() price: number;
  pricePlusVat: number;

  constructor(private vatCalc: VatCalcPipe) {}

  ngOnInit() {
    this.pricePlusVat = this.vatCalc.transform(this.price);
  }

}
