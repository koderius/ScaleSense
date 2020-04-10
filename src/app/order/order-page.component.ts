import { Component, OnInit } from '@angular/core';
import {ActivatedRoute} from '@angular/router';

@Component({
  selector: 'app-order',
  templateUrl: './order-page.component.html',
  styleUrls: ['./order-page.component.scss'],
})
export class OrderPage implements OnInit {

  order = {id: '20-123456'};

  wizardStep: 1 | 2 | 3;
  isEdit: boolean;

  mySuppliers = [
    {
      id: '1',
      name: 'moshe',
      logo: '',
    },
    {
      id: '2',
      name: 'jud',
      logo: '',
    },
    {
      id: '3',
      name: 'dror',
      logo: '',
    },
    {
      id: '4',
      name: 'kobi',
      logo: '',
    },
    {
      id: '5',
      name: 'ruti',
      logo: '',
    },
    {
      id: '6',
      name: 'deb',
      logo: '',
    },
    {
      id: '7',
      name: 'dabeshet',
      logo: '',
    }
  ];

  suppliersSearchResults : any[] = [];
  showAllSuppliers: boolean;

  selectedSupplier: string;

  constructor(
    private activeRoute: ActivatedRoute,
  ) {}

  get isNewOrder() : boolean {
    return !!this.wizardStep;
  }

  get pageTitle() : string {
    if(!this.isNewOrder)
      return (this.isEdit ? 'עריכת הזמנה מס. ' : 'פרטי הזמנה מס. ') + this.order.id;
  }

  ngOnInit() {

    // Get the order ID from the URL, or a new order
    const urlSnapshot = this.activeRoute.snapshot;
    if(urlSnapshot.params['id'] == 'new')
      this.wizardStep = 1;
    else {
      // TODO: Load order by ID
      this.isEdit = urlSnapshot.queryParams['edit'];
    }

  }


  getSelectedSupplier() {
    //TODO
  }


  getCommonSearches() {
    return this.mySuppliers.slice(0,5);
    // TODO: Get real common searches
  }


  searchSupplier(q: string) {
    if(!q) {
      this.suppliersSearchResults = [];
      return;
    }
    if(this.showAllSuppliers)
      this.suppliersSearchResults = this.mySuppliers.filter((s)=>s.name.startsWith(q));
    else
      // TODO: Query from server + by category + by products
      this.suppliersSearchResults = this.mySuppliers.filter((s)=>s.name.startsWith(q));
  }

  loadAllSuppliers() {
    // TODO: Load from server
    this.showAllSuppliers = true;
  }

}
