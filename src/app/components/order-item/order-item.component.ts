import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {Order} from '../../models/Order';
import {SuppliersService} from '../../services/suppliers.service';
import {BusinessService} from '../../services/business.service';
import {CustomersService} from '../../services/customers.service';
import {BusinessDoc} from '../../models/Business';
import {OrderStatus} from '../../models/OrderI';
import {NavigationService} from '../../services/navigation.service';

export type OrderActionMode = 'view' | 'edit' | 'drafts' | 'receive' | 'goods_return';

@Component({
  selector: 'app-order-item',
  templateUrl: './order-item.component.html',
  styleUrls: ['./order-item.component.scss'],
})
export class OrderItemComponent implements OnInit {

  // Order to show
  @Input() order: Order;
  // What to do with this order?
  @Input() actionMode: OrderActionMode;

  // On clicking the delete draft button
  @Output() deleteDraftClick = new EventEmitter();
  // On clicking the action button
  @Output() actionClick = new EventEmitter();

  // Whether a draft
  isDraft: boolean;

  // Data of the related other business of this order
  businessData: BusinessDoc;

  constructor(
    private suppliersService: SuppliersService,
    private customersService: CustomersService,
    public businessService: BusinessService,
    private navService: NavigationService,
  ) { }


  ngOnInit() {

    this.isDraft = this.order.status == OrderStatus.DRAFT;

    // Get the data of the related business of this order
    if(this.businessService.side == 'c')
      this.businessData = this.suppliersService.getSupplierById(this.order.sid);
    else
      this.businessData = this.customersService.getCustomerById(this.order.cid);

  }


  // When to show status in red color
  get statusInRed() {
    return this.order.status >= OrderStatus.FINAL_APPROVE;
  }


  // Button title
  get actionBtnTitle() {
    switch (this.actionMode) {
      case 'view': return 'צפייה בהזמנה';
      case 'edit': return 'עריכת הזמנה';
      case 'drafts': return 'כניסה להזמנה';
      case 'receive': return 'כניסה להזמנה';
      case 'goods_return': return 'צפייה בהזמנה';
    }
  }


  // When clicking the open button
  actionClicked() {
    // Send event
    this.actionClick.emit();
    // Internal actions
    switch (this.actionMode) {
      case 'drafts': this.navService.goToDraft(this.order.id); break;
      case 'view': this.navService.goToOrder(this.order.id); break;
      case 'edit': this.navService.goToOrder(this.order.id, true); break;
      case 'receive': this.navService.goToReception(this.order.id); break;
      case 'goods_return': break;
    }

  }


  /* Disable *edit* button when order has been already approved.
   * Disable *receive* when order has already been closed or cancelled
   * Disable *return* if order is not closed
   * */
  get btnDisabled() {
    return (this.actionMode == 'edit' && this.order.status >= OrderStatus.FINAL_APPROVE)
      || (this.actionMode == 'receive' && this.order.status >= OrderStatus.CLOSED)
      || (this.actionMode == 'goods_return' && this.order.status != OrderStatus.CLOSED);
  }

}
