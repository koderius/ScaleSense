import {Component, Input, OnInit} from '@angular/core';
import {OrderChange, OrderDoc, OrderStatus, ProductOrder} from '../../models/OrderI';
import {AuthService} from '../../services/auth.service';
import {ProductsService} from '../../services/products.service';
import {ProductPublicDoc} from '../../models/Product';

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

  productChanges: {old: ProductOrder, current: ProductOrder}[] = [];
  productsData: ProductPublicDoc[] = [];

  lines: string[] = [];

  hasDetails: boolean;
  showMore: boolean;


  constructor(
    private authService: AuthService,
    private productService: ProductsService,

  ) {}

  async ngOnInit() {

    // Get the user name if on the same side, or a generic name of the other side
    const user = this.authService.currentUser.side == this.change.side ? (await this.authService.getUserDoc(this.change.by)) : null;
    this.userName = user ? `<b>${user.displayName}</b>` : (this.authService.currentUser.side == 'c' ? 'הלקוח' : 'הספק');

    switch (this.change.status) {
      case OrderStatus.SENT: this.action = 'ההזמנה נשלחה ע"י'; break;
      case OrderStatus.APPROVED: this.action = 'ההזמנה אושרה ע"י'; break;
      case OrderStatus.CLOSED: this.action = 'ההזמנה נסגרה ע"י'; break;
      case OrderStatus.CANCELED_BY_CUSTOMER: case OrderStatus.CANCELED_BY_SUPPLIER: this.action = 'ההזמנה בוטלה ע"י'; break;
      default: this.action = 'ההזמנה שונתה ע"י'; this.hasDetails = true;
    }

    // Add lines for changes details
    if(this.hasDetails) {

      // Read current version and previous version JSON data
      this.current = JSON.parse(this.change.data) as OrderDoc;
      this.old = this.previousChangeData ? JSON.parse(this.previousChangeData) : null as OrderDoc;

      // Calc current price
      this.current.products.forEach((p)=>{
        this.currentPrice += ((p.pricePerUnit || 0) * (p.amount || 0));
      });

      // Calc old price
      this.old.products.forEach((p)=>{
        this.oldPrice += ((p.pricePerUnit || 0) * (p.amount || 0));
      });

      // List all products IDs from both old and current versions and compare them
      const productsIds = new Set<string>();
      [...this.old.products, ...this.current.products].forEach((p)=>{
        if(!productsIds.has(p.id)) {

          const oldProduct = this.old.products.find((product)=>p.id == product.id);
          const currentProduct = this.current.products.find((product)=>p.id == product.id);

          if(!currentProduct || !oldProduct || currentProduct.amount != oldProduct.amount || currentProduct.pricePerUnit != oldProduct.pricePerUnit || currentProduct.comment != oldProduct.comment)
            this.productChanges.push({old: oldProduct, current: currentProduct});

          productsIds.add(p.id);

        }
      });

      this.productsData = await this.productService.loadProductsByIds([...productsIds.values()]);

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
