import { Component, OnInit } from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {NavController} from '@ionic/angular';

@Component({
  selector: 'app-order',
  templateUrl: './order-page.component.html',
  styleUrls: ['./order-page.component.scss'],
})
export class OrderPage implements OnInit {

  /** The order to show/edit/create */
  order = {id: '20-123456'};

  /** In creation of new order - the step of creation */
  wizardStep: 1 | 2 | 3;

  /** Whether in edit mode (Not in new order) */
  isEdit: boolean;

  /** In edit mode: show screen of adding new products (same screen as creation wizard step 2) */
  addProductsScreen: boolean;

  /** Whether the order (or order changes) was sent */
  orderSent: boolean;

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
    private navCtrl: NavController,
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

  backToMain() {
    this.navCtrl.navigateRoot('customer');
  }

  goToSummery() {
    if(this.isNewOrder)
      this.wizardStep = 3;
    else if(this.isEdit)
      this.addProductsScreen = false
  }

  goToAddProducts() {
    if(this.isNewOrder)
      this.wizardStep = 2;
    else if(this.isEdit)
      this.addProductsScreen = true;
  }

  saveOrder() {
    // TODO: Save as a draft
  }

  sendOrder() {
    // TODO: Send the order
    this.orderSent = true;
  }

  cancelOrder() {
    // TODO: Cancel
  }

}
