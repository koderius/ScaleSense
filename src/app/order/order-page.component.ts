import { Component, OnInit } from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {NavController} from '@ionic/angular';
import {SuppliersService} from '../services/suppliers.service';
import {Order} from '../models/Order';
import {OrdersService} from '../services/orders.service';
import {ProductsService} from '../services/products.service';
import {ProductDoc} from '../models/Product';
import {BusinessDoc} from '../models/Business';

@Component({
  selector: 'app-order',
  templateUrl: './order-page.component.html',
  styleUrls: ['./order-page.component.scss'],
})
export class OrderPage implements OnInit {

  /** The order to show/edit/create */
  order: Order;

  /** In creation of new order - the step of creation */
  wizardStep: 1 | 2 | 3;

  /** Whether in edit mode (Not in new order) */
  isEdit: boolean;

  /** In edit mode: show screen of adding new products (same screen as creation wizard step 2) */
  addProductsScreen: boolean;

  /** Whether the order (or order changes) was sent */
  orderSent: boolean;

  /** List of suppliers according to query */
  suppliersSearchResults: string[] = [];

  /** Whether to show all suppliers */
  showAllSuppliers: boolean;

  /** Selected supplier when creating a new order */
  selectedSupplier: string;

  /** The list of products of the order's supplier, and a filtered list while querying */
  supplierProducts: ProductDoc[] = [];
  filteredSupplierProducts: ProductDoc[] = null;

  /** Date and time inputs */
  dateFocus: boolean;
  timeFocus: boolean;
  supplyDate: Date;
  supplyTime: Date;

  constructor(
    private activeRoute: ActivatedRoute,
    private navCtrl: NavController,
    public suppliersService: SuppliersService,
    private ordersService: OrdersService,
    private productsService: ProductsService,
  ) {}

  /** Whether in mode of creating new order (with wizard) */
  get isNewOrder() : boolean {
    return !!this.wizardStep;
  }

  /** The page title (when there is no wizard) */
  get pageTitle() : string {
    if(!this.isNewOrder)
      return (this.isEdit ? 'עריכת הזמנה מס. ' : 'פרטי הזמנה מס. ') + this.order.id;
  }

  ngOnInit() {

    // Get the order ID from the URL, or a new order
    const urlSnapshot = this.activeRoute.snapshot;
    const orderId = urlSnapshot.params['id'];

    // Create new order and go to step 1 (choosing supplier)
    if(orderId == 'new') {
      this.order = this.ordersService.createNewOrder();
      this.wizardStep = 1;
    }
    // Or, get the order details and check whether its edit mode (or only preview)
    else {
      this.order = this.ordersService.getOrderById(orderId);
      if(this.order) {
        this.productsService.loadProductsDetails(this.order.products.map((p)=>p.id));   //TODO: This will load only the first 10 - do pagination
        this.isEdit = urlSnapshot.queryParams['edit'];
      }
    }

  }


  /** On new order, step 1: Go to next step with the selected supplier */
  chooseSupplier() {
    if(this.selectedSupplier) {
      this.order.setSupplier(this.selectedSupplier);
      this.wizardStep = 2;
      this.loadSupplierProducts();
    }
  }


  /** Load all the products of the supplier.
   * In new order - after choosing supplier.
   * On editing - when choosing to add new products */
  loadSupplierProducts() {
    this.supplierProducts = this.productsService.loadAllProductsOfSupplier(this.order.sid);
  }


  findProductDetails(id: string) {
    return this.productsService.getProductDetails(id);
  }


  // Get 5 most common search suppliers (IDs) not including those in the search results
  get commonSuppliers() : string[] {
    return this.suppliersService.mySuppliers.filter((s)=>!this.suppliersSearchResults.includes(s.id))
    // TODO: Get real common searches
      .slice(0,5).map((s)=>s.id);
  }

  // Get all suppliers IDs except those in the search results
  get allSuppliers() {
    if(this.showAllSuppliers)
      return this.suppliersService.mySuppliers.map((s)=>s.id)
        .filter((id)=>!this.commonSuppliers.includes(id) && !this.suppliersSearchResults.includes(id));
    else
      return [];
  }

  // Search suppliers
  async searchSupplier(q: string) {
    if(!q) {
      this.suppliersSearchResults = [];
      return;
    }
    this.suppliersSearchResults = (await this.suppliersService.querySuppliers(q)).map((s)=>s.id);
  }

  getSupplierData(id: string) {
    return this.suppliersService.getSupplierById(id);
  }

  searchProduct(q: string) {
    if(!q) {
      this.filteredSupplierProducts = null;
      return;
    }
    q = q.toLowerCase();
    this.filteredSupplierProducts = this.supplierProducts.filter((p)=>p.name.toLowerCase().includes(q) || (p.category || '').toLowerCase().includes(q));
  }


  loadAllSuppliers() {
    // TODO: Load from server
    this.showAllSuppliers = true;
  }

  /** Get supplier details */
  getSelectedSupplier() {
    return this.suppliersService.getSupplierById(this.selectedSupplier);
  }

  backToMain() {
    this.navCtrl.navigateRoot('customer');
  }

  editProduct() {
    alert('מה הכפתור הזה אמור לעשות?');
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
    else if(this.isEdit) {
      this.loadSupplierProducts();
      this.addProductsScreen = true;
    }
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
