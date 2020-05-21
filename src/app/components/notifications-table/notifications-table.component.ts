import {Component, OnInit} from '@angular/core';
import {BusinessService} from '../../services/business.service';
import {NotificationsService} from '../../services/notifications.service';
import {NavigationService} from '../../services/navigation.service';
import {AlertsService} from '../../services/alerts.service';
import {AppNotification, NotificationCode} from '../../models/Notification';

@Component({
  selector: 'app-notifications-table',
  templateUrl: './notifications-table.component.html',
  styleUrls: ['./notifications-table.component.scss'],
})
export class NotificationsTableComponent implements OnInit {

  businessColumnTitle: string;

  constructor(
    private businessService: BusinessService,
    public notificationsService: NotificationsService,
    private navService: NavigationService,
    private alerts: AlertsService,
  ) { }

  ngOnInit() {
    this.businessColumnTitle = 'שם ה' + (this.businessService.side == 'c' ? 'ספק' : 'לקוח');
  }

  isNotificationRead(notification: AppNotification) {
    return this.notificationsService.isRead(notification);
  }

  openNotification(notification: AppNotification) {
    this.notificationsService.markAsRead(notification);
    if(notification.code == NotificationCode.ORDER_CHANGE || notification.code == NotificationCode.ORDER_ALERT) {
      this.navService.goToOrder(notification.content.orderId);
    }
    if(notification.code == NotificationCode.PRODUCT_CHANGE) {
      this.navService.goToEditProduct(notification.content.productId);
    }
    if(notification.code == NotificationCode.PRODUCTS_RETURN) {
      this.navService.goToReturnsList();
    }
  }

  async onDeleteClicked(noteId: string) {
    if(await this.alerts.areYouSure('האם למחוק התראה זו?'))
      this.notificationsService.deleteNotification(noteId);
  }

}
