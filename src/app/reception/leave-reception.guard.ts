import { Injectable } from '@angular/core';
import {ActivatedRouteSnapshot, RouterStateSnapshot, CanDeactivate} from '@angular/router';
import {AlertsService} from '../services/alerts.service';
import {ReceptionPage} from './reception.page';

@Injectable({
  providedIn: 'root'
})
export class LeaveReceptionGuard implements CanDeactivate<ReceptionPage> {

  constructor(private alerts: AlertsService) {}

  async canDeactivate(
    component: ReceptionPage, currentRoute: ActivatedRouteSnapshot,
    currentState: RouterStateSnapshot,
    nextState?: RouterStateSnapshot): Promise<boolean>
  {

    // If the reception has not been done yet, ask to leave
    if(component.hasChanges)
      return await this.alerts.areYouSure('האם לצאת מתהליך קבלת הסחורה?', 'השינויים לא יישמרו');
    else
      return true;

  }

}
