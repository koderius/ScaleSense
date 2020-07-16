import {Component, Input, OnInit} from '@angular/core';
import {OrderStatus} from '../../models/OrderI';
import {AuthService} from '../../services/auth.service';
import {OrderChange, OrderChangeFactory} from '../../models/Changes';

@Component({
  selector: 'app-order-change-report',
  templateUrl: './order-change-report.component.html',
  styleUrls: ['./order-change-report.component.scss'],
})
export class OrderChangeReportComponent implements OnInit {

  readonly DELETED = OrderChangeFactory.CommentDeleted;

  @Input() orderChange: OrderChange;

  userName: string;
  action: string;

  showMore: boolean;

  // Show changes details only if there are changes and the status was not set to CANCELED or CLOSED
  get showDetails() {
    return this.orderChange.hasChanges && this.orderChange.newStatus < OrderStatus.CLOSED;
  }

  constructor(private authService: AuthService) {}

  async ngOnInit() {

    // Get the user name if on the same side, or a generic name of the other side
    const username = this.authService.currentUser.side == this.orderChange.side ? this.orderChange.username : null;
    this.userName = username ? `<b>${username}</b>` : (this.orderChange.side == 'c' ? 'הלקוח' : 'הספק');

    // Get the action name
    switch (this.orderChange.newStatus) {
      case OrderStatus.SENT: this.action = 'ההזמנה נשלחה ע"י'; return;
      case OrderStatus.EDITED: this.action = 'ההזמנה נערכה ע"י'; break;
      case OrderStatus.OPENED: this.action = 'ההזמנה נפתחה ע"י'; return;
      case OrderStatus.CHANGED: this.action = 'ההזמנה שונתה ע"י'; break;
      case OrderStatus.APPROVED: case OrderStatus.APPROVED_WITH_CHANGES: this.action = 'ההזמנה אושרה ע"י'; break;
      case OrderStatus.FINAL_APPROVE: case OrderStatus.FINAL_APPROVE_WITH_CHANGES: this.action = 'ההזמנה אושרה סופית ע"י'; break;
      case OrderStatus.CLOSED: this.action = 'ההזמנה נסגרה ע"י'; return;
      case OrderStatus.CANCELED_BY_CUSTOMER: case OrderStatus.CANCELED_BY_SUPPLIER: this.action = 'ההזמנה בוטלה ע"י'; return;
    }

  }

}
