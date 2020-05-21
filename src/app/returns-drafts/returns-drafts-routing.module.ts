import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ReturnsDraftsPage } from './returns-drafts.page';

const routes: Routes = [
  {
    path: '',
    component: ReturnsDraftsPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ReturnsDraftsPageRoutingModule {}
