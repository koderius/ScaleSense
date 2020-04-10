import {Component, Input, OnInit} from '@angular/core';

@Component({
  selector: 'app-product-summery',
  templateUrl: './product-summery.component.html',
  styleUrls: ['./product-summery.component.scss'],
})
export class ProductSummeryComponent implements OnInit {

  @Input() product;
  @Input() isEdit: boolean;
  @Input() withComments: boolean;

  constructor() { }

  ngOnInit() {}

  get rowLength() : number {
    return (+this.isEdit || 0) + (+this.withComments || 0);
  }

}
