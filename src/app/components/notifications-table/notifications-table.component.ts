import { Component, OnInit } from '@angular/core';
import {BusinessService} from '../../services/business.service';
import {AppNotification, NotificationsService} from '../../services/notifications.service';
import {NavigationService} from '../../services/navigation.service';
import {AlertsService} from '../../services/alerts.service';

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
    if(notification.orderId) {
      this.navService.goToOrder(notification.orderId);
    }
  }

  async onDeleteClicked(noteId: string) {
    if(await this.alerts.areYouSure('האם למחוק התראה זו?'))
      this.notificationsService.deleteNotification(noteId);
  }

}
