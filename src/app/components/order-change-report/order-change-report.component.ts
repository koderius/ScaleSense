import {Component, Input, OnInit} from '@angular/core';
import {OrderChange, OrderDoc, OrderStatus} from '../../models/OrderI';
import {ProductsService} from '../../services/products.service';
import {ProductPublicDoc} from '../../models/ProductI';
import {ProductsChange, ProductsListUtil} from '../../utilities/productsList';
import {AuthService} from '../../services/auth.service';

@Component({
  selector: 'app-order-change-report',
  templateUrl: './order-change-report.component.html',
  styleUrls: ['./order-change-report.component.scss'],
})
export class OrderChangeReportComponent implements OnInit {

  @Input() change: OrderChange;
  @Input() previousChangeData: string;

  userName: string;
  action: string;

  current: OrderDoc;
  old: OrderDoc;
  oldPrice: number = 0;
  currentPrice: number = 0;

  // productChanges: {old: ProductOrder, current: ProductOrder}[] = [];
  productChanges: ProductsChange[] = [];
  productsData: ProductPublicDoc[] = [];

  hasDetails: boolean;
  showMore: boolean;


  constructor(
    private authService: AuthService,
    private productService: ProductsService,

  ) {}

  async ngOnInit() {

    // Get the user name if on the same side, or a generic name of the other side
    const user = this.authService.currentUser.side == this.change.side ? (await this.authService.getUserDoc(this.change.by)) : null;
    this.userName = user ? `<b>${user.displayName}</b>` : (this.change.side == 'c' ? 'הלקוח' : 'הספק');

    switch (this.change.status) {
      case OrderStatus.SENT: this.action = 'ההזמנה נשלחה ע"י'; return;
      case OrderStatus.EDITED: this.action = 'ההזמנה נערכה ע"י'; break;
      case OrderStatus.OPENED: this.action = 'ההזמנה נפתחה ע"י'; return;
      case OrderStatus.CHANGED: this.action = 'ההזמנה שונתה ע"י'; break;
      case OrderStatus.APPROVED: case OrderStatus.APPROVED_WITH_CHANGES: this.action = 'ההזמנה אושרה ע"י'; break;
      case OrderStatus.FINAL_APPROVE: case OrderStatus.FINAL_APPROVE_WITH_CHANGES: this.action = 'ההזמנה אושרה סופית ע"י'; break;
      case OrderStatus.CLOSED: this.action = 'ההזמנה נסגרה ע"י'; return;
      case OrderStatus.CANCELED_BY_CUSTOMER: case OrderStatus.CANCELED_BY_SUPPLIER: this.action = 'ההזמנה בוטלה ע"י'; return;
    }

    // Read current version and previous version JSON data
    this.current = JSON.parse(this.change.data) as OrderDoc;
    this.old = this.previousChangeData ? JSON.parse(this.previousChangeData) : null as OrderDoc;

    this.productChanges = ProductsListUtil.CompareLists(this.old.products, this.current.products);

    this.hasDetails = !!(this.current.supplyTime != this.old.supplyTime || this.current.comment != this.old.comment || this.productChanges.length);

    // Add lines for changes content
    if(this.hasDetails) {

      // Calc current price
      this.current.products.forEach((p)=>{
        this.currentPrice += ((p.priceInOrder || 0) * (p.amount || 0));
      });

      // Calc old price
      this.old.products.forEach((p)=>{
        this.oldPrice += ((p.priceInOrder || 0) * (p.amount || 0));
      });

      // Get the products data
      this.productsData.splice(0);
      this.productChanges.forEach(async (p)=>{
        this.productsData.push(await this.productService.getProduct(p.productId));
      });

    }

  }

  getProductName(productId: string) {
    const p = this.productsData.find((p)=>p.id == productId);
    return p ? p.name : '';
  }

  getProductUnit(productId: string) {
    const p = this.productsData.find((p)=>p.id == productId);
    return p ? p.type : null;
  }

}
