import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {ProductOrder} from '../../models/OrderI';
import {ProductPublicDoc} from '../../models/Product';

@Component({
  selector: 'app-product-summery',
  templateUrl: './product-summery.component.html',
  styleUrls: ['./product-summery.component.scss'],
})
export class ProductSummeryComponent implements OnInit {

  @Input() productOrder: ProductOrder;
  @Input() productDetails: ProductPublicDoc;
  @Input() isEdit: boolean;
  @Input() withComments: boolean;

  @Output() editClicked = new EventEmitter();
  @Output() clearClicked = new EventEmitter();

  randomSkeletonWidth = (Math.random()*100) + '%';

  constructor() { }

  ngOnInit() {}

}
