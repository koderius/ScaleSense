import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ReceptionPage } from './reception.page';
import {LeaveReceptionGuard} from './leave-reception.guard';
import {ReceptionGuard} from './reception.guard';

const routes: Routes = [
  {
    path: ':id',
    component: ReceptionPage,
    canDeactivate: [LeaveReceptionGuard],
    canActivate: [ReceptionGuard],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ReceptionPageRoutingModule {}
