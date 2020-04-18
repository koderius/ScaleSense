import {Component, Input, OnInit} from '@angular/core';
import {MetadataService} from '../../services/metadata.service';

@Component({
  selector: 'app-products-total-price',
  templateUrl: './products-total-price.component.html',
  styleUrls: ['./products-total-price.component.scss'],
})
export class ProductsTotalPriceComponent implements OnInit {

  @Input() price: number;
  pricePlusVat: number;

  constructor() {}

  ngOnInit() {
    this.pricePlusVat = this.price * MetadataService.VAT;
  }

}
