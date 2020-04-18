import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {NavController} from '@ionic/angular';
import {SuppliersService} from '../services/suppliers.service';
import {Order, OrderChange, OrderStatus, ProductOrder} from '../models/Order';
import {OrdersService} from '../services/orders.service';
import {ProductsService} from '../services/products.service';
import {ProductDoc} from '../models/Product';
import {AlertsService} from '../services/alerts.service';
import {formatDate} from '@angular/common';

@Component({
  selector: 'app-order',
  templateUrl: './order-page.component.html',
  styleUrls: ['./order-page.component.scss'],
})
export class OrderPage implements OnInit {

  /** The order to show/edit/create */
  order: Order;

  /** The JSON of the order as it was when the page loaded - to check changes */
  originalOrder: string;

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
  supplyDateInput: Date;
  supplyHourInput: string;
  now = new Date().toISOString().slice(0,10); // Today's date as yyyy-mm-dd

  constructor(
    private activeRoute: ActivatedRoute,
    private navCtrl: NavController,
    public suppliersService: SuppliersService,
    private ordersService: OrdersService,
    private productsService: ProductsService,
    private alerts: AlertsService,
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

  async ngOnInit() {

    // Get the order ID from the URL, or a new order
    const urlSnapshot = this.activeRoute.snapshot;
    const orderId = urlSnapshot.params['id'];

    // Create new order and go to step 1 (choosing supplier)
    if(orderId == 'new') {
      this.order = await this.ordersService.createNewOrder();
      this.wizardStep = 1;
      this.isEdit = true;
    }
    // Or, get the order details
    else {
      this.order = await this.ordersService.getOrderById(orderId);
      if(this.order) {
        this.productsService.loadProductsDetails(this.order.products.map((p)=>p.id));   //TODO: This will load only the first 10 - do pagination
        // If the order is still a draft, go to the 3rd step of the wizard
        if(this.order.status == OrderStatus.DRAFT) {
          this.wizardStep = 3;
          this.selectedSupplier = this.order.sid;
          this.loadSupplierProducts();
        }
        // Check whether it's an edit or preview mode
        this.isEdit = urlSnapshot.queryParams['edit'] || this.order.status == OrderStatus.DRAFT;
      }
    }

    // Keep the original order to check changes
    this.originalOrder = JSON.stringify(this.order);

    // Split order's supply time into 2 inputs
    if(this.order.supplyTime) {
      this.supplyDateInput = new Date(this.order.supplyTime);
      this.supplyHourInput = new Date(this.order.supplyTime).toLocaleTimeString();
    }

  }


  orderHasChanged(): boolean {
    return this.originalOrder != JSON.stringify(this.order);
  }


  mergeDateAndTime() {
    if(this.supplyDateInput && this.supplyHourInput) {
      const time = new Date(this.supplyDateInput);
      time.setHours(+this.supplyHourInput.slice(0,2));
      time.setMinutes(+this.supplyHourInput.slice(3,5));
      this.order.supplyTime = time.getTime();
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
    this.showAllSuppliers = true;
  }

  /** Get supplier details */
  getSelectedSupplier() {
    return this.suppliersService.getSupplierById(this.order.sid);
  }

  /** Load all the products of the supplier.
   * In new order - after choosing supplier.
   * On editing - when choosing to add new products */
  async loadSupplierProducts() {
    this.supplierProducts = [];
    this.supplierProducts = await this.productsService.loadAllProductsOfSupplier(this.order.sid);
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

  async saveOrder() {

    // Save on server
    this.alerts.loaderStart('שומר הזמנה...');
    await this.ordersService.saveOrder(this.order);
    this.alerts.loaderStop();

    // Update the original order for checking further changes
    this.originalOrder = JSON.stringify(this.order);

  }

  async sendOrder() {

    if(!this.order.supplyTime) {
      alert('יש למלא תאריך הזמנה');
      return;
    }

    if(await this.alerts.areYouSure('האם לשלוח הזמנה לספק?')) {

      // First, save the order
      this.alerts.loaderStart('שולח הזמנה לספק...');
      if(await this.ordersService.saveOrder(this.order)) {

        if(await this.ordersService.sendOrder(this.order.id))
          this.orderSent = true;

      }
      this.alerts.loaderStop();
    }

  }

  cancelOrder() {
    // TODO: Cancel
  }


  changeText(orderChange: OrderChange) {

    const change = orderChange.change;

    // Change in supply date
    if (typeof change.new == 'number' && typeof change.old == 'number') {
      const oldDate = formatDate(change.old, 'dd/MM/yyyy','en-US');
      const newDate = formatDate(change.new, 'dd/MM/yyyy','en-US');
      return `שונה תאריך האספקה מ-${oldDate} ל-${newDate}.`;
    }

    // Change in comment to the supplier
    if (typeof change.new == 'number' && typeof change.old == 'number')
      return  change.old
        ? ('שונתה הערה לספק מ-"' + change.old + '" ל-"' + change.new + '"')
        : ('הוספה הערה לספק: "' + change.new + '"');

    // Change in product
    const newAmount = (change.new as ProductOrder).amount;
    const oldAmount = (change.old as ProductOrder).amount;
    const productName = this.productsService.getProductDetails((change.new as ProductOrder).id);
    let str = '';
    if(oldAmount && !newAmount)
      str += 'הוסר המוצר ';
    if(!oldAmount && newAmount)
      str += 'הוסף המוצר ';
    if(oldAmount && newAmount)
      str += 'שונתה כמות המוצר ';
    str += productName + '. | ';
    str += 'בעקבות השינוי עודכן מחיר ההזמנה מ-' + orderChange.priceChange.old + 'ש"ח ל-' + orderChange.priceChange.new + 'ש"ח.';

    return str;

  }

}
