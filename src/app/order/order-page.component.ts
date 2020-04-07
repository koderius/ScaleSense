import { Component, OnInit } from '@angular/core';
import {ActivatedRoute} from '@angular/router';

@Component({
  selector: 'app-order',
  templateUrl: './order-page.component.html',
  styleUrls: ['./order-page.component.scss'],
})
export class OrderPage implements OnInit {

  wizardStep: 1 | 2| 3;

  constructor(
    private activeRoute: ActivatedRoute,
  ) {

    // Get the order ID from the URL, or a new order
    this.activeRoute.params.subscribe((params)=>{
      if(params['id'] == 'new')
        this.wizardStep = 1;
      else {
        // TODO: Load order by ID
      }
    })

  }

  ngOnInit() {
  }

}
