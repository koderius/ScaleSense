import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {NavController} from '@ionic/angular';
import {SuppliersService} from '../services/suppliers.service';
import {OrderDoc, OrderStatus, ProductOrder} from '../models/OrderI';
import {OrdersService} from '../services/orders.service';
import {ProductsService} from '../services/products.service';
import {ProductDoc} from '../models/Product';
import {AlertsService} from '../services/alerts.service';
import {Order} from '../models/Order';
import {formatDate} from '@angular/common';
import {Objects} from '../utilities/objects';
import {AuthService} from '../services/auth.service';
import {NavigationService} from '../services/navigation.service';

@Component({
  selector: 'app-order',
  templateUrl: './order.page.html',
  styleUrls: ['./order.page.scss'],
})
export class OrderPage implements OnInit {

  /** The order to show/edit/create */
  order: Order;

  /** The JSON of the order as it was when the page loaded - to check changes */
  originalOrder: OrderDoc;

  /** The key on the local storage where the data of an unsaved order is being stored */
  readonly TEMP_DATA_KEY = 'scale-sense_TempOrderData-';

  /** Auto save interval timer */
  autoSave;

  /**
   *  page 1: Selecting a supplier (Drafts only)
   *  page 2: Choosing products (Drafts & edit mode only)
   *  page 3: Order summery (Drafts + edit + view)
   * */
  private _page: number;

  /** Whether in edit mode (editing existing order or creating/editing a draft). Fields are open to be written */
  isEdit: boolean;

  /** Whether the order (or order changes) was sent */
  orderSent: boolean;

  /** List of suppliers according to query */
  suppliersSearchResults: string[] = [];

  /** Whether to show all suppliers */
  showAllSuppliers: boolean;

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
    public suppliersService: SuppliersService,
    private ordersService: OrdersService,
    private productsService: ProductsService,
    private alerts: AlertsService,
    private authService: AuthService,
    private navService: NavigationService,
  ) {}

  /** Whether in mode of draft (with wizard) */
  get isDraft() : boolean {
    return this.order && this.order.status == OrderStatus.DRAFT;
  }

  /** Whether the draft is new (not saved yet) */
  get isNew() : boolean {
    return !this.order.id;
  }

  get newSerialMsg() {
    return this.isNew ? '* מספר הזמנה זמני (כל עוד הטיוטה טרם נשמרה)' : '';
  }

  /** The page title (when there is no wizard) */
  get pageTitle() : string {
    if(!this.isDraft)
      return (this.isEdit ? 'עריכת הזמנה מס. ' : 'פרטי הזמנה מס. ') + this.order.serial;
  }

  get pageTitleComment() : string {
    if(this.order.status == OrderStatus.CANCELED_BY_SUPPLIER || this.order.status == OrderStatus.CANCELED_BY_CUSTOMER)
      return 'מבוטלת';
    if(this.order.status == OrderStatus.CLOSED)
      return 'סגורה';
  }

  get page() {
    return this._page;
  }

  set page(step) {

    // Page 1 can be entered only in draft mode
    if(step == 1 && !this.isDraft)
      return;
    // Changing supplier (in draft mode only) requires clearing the product list
    if(step == 1 && this.order.products.length)
      this.alerts.areYouSure('האם להחליף ספק?', 'החלפת הספק תביא למחיקת רשימת המוצרים הקיימת בהזמנה').then((r)=>{
        if(r)
          this.order.clearProducts();
        else
          this.page = 2;
      });
    // Page 2 can be entered only in edit mode (or draft)
    if(step == 2 && !this.isEdit)
      return;
    // Page 3 can be entered only if there are products
    if(step == 3 && !this.order.products.length)
      step = 2;

    this._page = step;

    // On page no. 2, load all the products of the current supplier
    if(this._page == 2) {
      this.supplierProducts = [];
      this.productsService.loadAllProductsOfSupplier(this.order.sid).then((res)=>{
        this.supplierProducts = res;
      });
    }

  }

  async ngOnInit() {

    // Get the order ID from the URL, or a new order
    const urlSnapshot = this.activeRoute.snapshot;
    const orderId = urlSnapshot.params['id'];

    // Create new order and go to step 1 (choosing supplier)
    if(orderId == 'new' && this.authService.currentUser.side == 'c') {
      this.order = await this.ordersService.createNewOrder();
      this.page = 1;
      this.isEdit = true;
    }
    // Or, get the order details and go to summery page. Enable edit if it's a draft or requested as edit mode
    else {
      this.order = await this.ordersService.getOrderById(orderId, urlSnapshot.queryParams['draft']);
      if(this.order) {
        this.page = 3;
        this.isEdit = (urlSnapshot.queryParams['edit'] || this.isDraft) && this.order.status < OrderStatus.CANNOT_BE_EDIT_FROM_HERE;
      }
      else {
        this.backToMain();
        return;
      }
    }

    // Check whether the order had sudden close before, and ask whether to load it
    if(this.isEdit) {
      const tempAutoSave = localStorage.getItem(this.TEMP_DATA_KEY + orderId);
      if(tempAutoSave && await this.alerts.areYouSure('האם לשחזר הזמנה שלא נשמרה?', '(הזמנה זו נסגרה באופן פתאומי ללא שמירה)', 'שחזור', 'לא, המשך')) {
        this.order = new Order(JSON.parse(tempAutoSave));
        this.page = 3;
      }
      else
        this.updateChanges();
    }

    // Keep the original order to check changes
    this.originalOrder = this.order.getDocument();

    // Get the details of the products that are in this order (if there are)
    this.productsService.loadProductsDetails(this.order.products.map((p)=>p.id));

    // Start auto saving the order data on the local storage every 3 seconds for backup
    // Save as long as there are changes being made since the last save. clear the backup when saving or when leaving safely through a guard
    this.autoSave = setInterval(()=>{
      if(this.orderHasChanged())
        localStorage.setItem(this.TEMP_DATA_KEY + (this.order.id || 'new'), JSON.stringify(this.order.getDocument()));
    }, 3000);

    // Split order's supply time into 2 inputs (date & time)
    if(this.order.supplyTime) {
      this.supplyDateInput = new Date(this.order.supplyTime);
      this.supplyHourInput = formatDate(new Date(this.order.supplyTime),'HH:mm','en-US');
    }

  }


  /** Check whether the order details has changed since the last save */
  orderHasChanged(): boolean {
    const orderDoc = this.order.getDocument();
    this.sortProductsByName(orderDoc.products);
    this.sortProductsByName(this.originalOrder.products);
    return !Objects.IsEqual(JSON.parse(JSON.stringify(orderDoc)), JSON.parse(JSON.stringify(this.originalOrder)));
  }

  updateChanges() {
    // Update the original order for checking further changes
    this.originalOrder = this.order.getDocument();
    // Clear the backup auto save
    localStorage.removeItem(this.TEMP_DATA_KEY + this.order.id);
    localStorage.removeItem(this.TEMP_DATA_KEY + 'new');
  }


  /** Set the order supply time by combining the date & time inputs */
  mergeDateAndTime() {
    if(this.supplyDateInput && this.supplyHourInput) {
      const time = new Date(this.supplyDateInput);
      time.setHours(+this.supplyHourInput.slice(0,2));
      time.setMinutes(+this.supplyHourInput.slice(3,5));
      this.order.supplyTime = time.getTime();
    }
    else
      this.order.supplyTime = null;
  }


  /** Get product details from the service */
  findProductDetails(id: string) {
    return this.productsService.getProductDetails(id);
  }


  /** Get 5 most common search suppliers (IDs) not including those in the search results */
  get commonSuppliers() : string[] {
    return this.suppliersService.mySuppliers.filter((s)=>!this.suppliersSearchResults.includes(s.id))
    // TODO: Get real common searches
      .slice(0,5).map((s)=>s.id);
  }

  /** Get all suppliers IDs except those in the search results */
  get allSuppliers() {
    if(this.showAllSuppliers)
      return this.suppliersService.mySuppliers.map((s)=>s.id)
        .filter((id)=>!this.commonSuppliers.includes(id) && !this.suppliersSearchResults.includes(id));
    else
      return [];
  }

  /** Filter suppliers by query text */
  async searchSupplier(q: string) {
    if(!q) {
      this.suppliersSearchResults = [];
      return;
    }
    this.suppliersSearchResults = (await this.suppliersService.querySuppliers(q)).map((s)=>s.id);
  }


  /** Get supplier's data from the service */
  getSupplierData(id: string) {
    return this.suppliersService.getSupplierById(id);
  }

  /** Get supplier details */
  getSelectedSupplier() {
    return this.getSupplierData(this.order.sid);
  }


  /** Filter products list according to the text query */
  searchProduct(q: string) {
    if(!q) {
      this.filteredSupplierProducts = null;
      return;
    }
    q = q.toLowerCase();
    this.filteredSupplierProducts = this.supplierProducts.filter((p)=>p.name.toLowerCase().includes(q) || (p.category || '').toLowerCase().includes(q));
  }


  /** Show all suppliers */
  loadAllSuppliers() {
    this.showAllSuppliers = true;
  }


  backToMain() {
    this.navService.goToMain();
  }

  selectProductInput(productId: string) {

    setTimeout(()=>{

      // Get the index of the product in the shown products list
      const productIdx = (this.filteredSupplierProducts || this.supplierProducts).findIndex((p)=>p.id == productId);

      // Get the product element, and select its input
      const product = document.getElementsByTagName('app-product-to-cart')[productIdx];
      product.getElementsByTagName('input')[0].select();

    }, this.page == 2 ? 0 : 500);

    if(this.page !== 2)
      this.page = 2;


  }

  /** Sort by name (if names are equal sort by ID, just for having a constant order) */
  sortProductsByName(products: ProductOrder[]) {
    return (products || []).sort((a, b)=>{
      const p1 = this.productsService.getProductDetails(a.id);
      const p2 = this.productsService.getProductDetails(b.id);
      if(p1 && p2) {
        if(p1.name > p2.name)
          return 1;
        if(p1.name < p2.name)
          return -1;
        else {
          if(p1.id > p2.id)
            return 1;
          if(p1.id < p2.id)
            return -1;
          return 0;
        }
      }
    });
  }

  async saveDraft() : Promise<boolean> {

    // Save draft on server
    if(this.order.status == OrderStatus.DRAFT) {
      const l = this.alerts.loaderStart('שומר טיוטה...');
      const res = await this.ordersService.saveDraft(this.order);
      this.alerts.loaderStop(l);
      if(res) {
        this.order = res;
        this.updateChanges();
      }
      return !!res;
    }

  }


  async sendOrder() {

    if(!this.order.supplyTime) {
      alert('יש למלא תאריך הזמנה.');
      return;
    }

    if(this.order.supplyTime <= Date.now()) {
      alert('לא ניתן להזין זמן אספקה שכבר עבר.');
      return;
    }

    if(!this.order.products.length) {
      alert('לא נבחרו מוצרים.');
      return;
    }

    if(await this.alerts.areYouSure(this.order.status == OrderStatus.DRAFT ? 'האם לשלוח הזמנה לספק?' : 'האם לשלוח לספק עדכון הזמנה?')) {

      const l = this.alerts.loaderStart(this.order.status == OrderStatus.DRAFT ? 'שולח הזמנה לספק...' : 'מעדכן הזמנה...');
      const res = await this.ordersService.updateOrder(this.order);
      if(res) {
        this.order.changes.push(res);
        this.updateChanges();
        if(this.order.status == OrderStatus.DRAFT)
          this.orderSent = true;
        else
          alert('עדכון נשלח לספק');
      }
      this.alerts.loaderStop(l);

    }

  }

  async cancelOrder() {
    if(await this.alerts.areYouSure(this.order.status == OrderStatus.DRAFT ? 'האם לבטל את ההזמנה?' : 'הספק יקבל עדכון על הביטול')) {
      const l = this.alerts.loaderStart('מבטל הזמנה...');
      const change = await this.ordersService.changeOrderStatus(this.order.id, OrderStatus.CANCELED_BY_CUSTOMER);
      this.alerts.loaderStop(l);
      if (change) {
        this.order.changes.push(change);
        this.ngOnInit();
        alert('ההזמנה בוטלה.');
      }
    }
  }

}
