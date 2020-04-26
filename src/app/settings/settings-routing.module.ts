import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SettingsPage } from './settings-page.component';
import {AppEnterGuard} from '../app-enter-guard.service';

const routes: Routes = [
  {
    path: '',
    component: SettingsPage
  },
  {
    path: 'suppliers-list',
    loadChildren: () => import('../suppliers-list/suppliers-list.module').then( m => m.SuppliersListPageModule),
    canActivateChild: [AppEnterGuard],
    data: {side: 'c'}
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SettingsPageRoutingModule {}
