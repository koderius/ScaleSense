import {Component} from '@angular/core';
import {ProductsService} from '../services/products.service';
import {ProductCustomerDoc, ProductPublicDoc, ProductType} from '../models/ProductI';
import {SuppliersService} from '../services/suppliers.service';
import {NavigationService} from '../services/navigation.service';
import {BusinessDoc} from '../models/Business';
import {BusinessService} from '../services/business.service';
import {XlsService} from '../services/xls.service';
import {ActionSheetController, ModalController} from '@ionic/angular';
import {CustomerPricingModalComponent} from '../customer-pricing-modal/customer-pricing-modal.component';
import {AlertsService} from '../services/alerts.service';
import {CustomersService} from '../services/customers.service';
import {XlsParseService} from '../services/xls-parse.service';
import {UsersService} from '../services/users.service';
import {UserPermission} from '../models/UserDoc';


@Component({
  selector: 'app-products-list',
  templateUrl: './products-list.page.html',
  styleUrls: ['./products-list.page.scss'],
})
export class ProductsListPage {

  filteredList: (ProductPublicDoc | ProductCustomerDoc)[];

  get results() {
    const list = (this.filteredList || this.productsService.myProducts);
    return this.showAllProducts ? list : list.slice((this.page - 1) * 10, this.page * 10);
  }

  businessList: BusinessDoc[] = [];

  q: string = '';
  bid: string;

  // For supplier, always false.
  // For customer, setting to true will show all the supplier's products (and not only those he has in his list)
  showAllProducts: boolean = false;

  isSearching: boolean;

  page: number = 1;

  constructor(
    public productsService: ProductsService,
    private suppliersService: SuppliersService,
    private customersService: CustomersService,
    public navService: NavigationService,
    public businessService: BusinessService,
    private excelService: XlsService,
    private excelParse: XlsParseService,
    private modalCtrl: ModalController,
    private alerts: AlertsService,
    private usersService: UsersService,
    private actionSheetCtrl: ActionSheetController,
  ) { }


  get canOfferPrice() {
    return this.usersService.hasPermission(UserPermission.OFFER_PRICE);
  }

  ionViewDidEnter() {

    // For customers, allow filter by supplier. for supplier allow filter by customer
    this.businessList = this.businessService.side == 'c' ? this.suppliersService.mySuppliers : this.customersService.myCustomers;

  }

  /**
   * Get orders by search query.
   * page = 0 (default) - new search
   * page = 1 - next page
   * page = -1 - previous page
   * */
  async search(movePage : number = 0) {

    // On new search, go back to first page
    if(movePage === 0)
      this.page = 1;

    // Filter my products by name and/or other side ID
    if(!this.showAllProducts) {
      this.page += movePage;
      this.filteredList = this.productsService.myProducts
        .filter((p)=>!this.bid || this.bid == (this.businessService.side == 'c' ? p.sid : p.cid))
        .filter((p)=>p.name.includes(this.q))
    }

    // Query all products from server, when customer choose to get not only his products
    else {
      this.isSearching = true;
      // Get results
      const res = await this.productsService.querySuppliersProducts(
        this.q,
        this.bid ? [this.bid] : this.suppliersService.mySuppliers.map((s)=>s.id),
        movePage == 1 ? this.filteredList.slice(-1)[0].name : null,
        movePage == -1 ? this.filteredList[0].name : null,
      );
      if(res) {
        this.filteredList = res;
        this.page += movePage;
      }
      this.isSearching = false;
    }

  }


  async importFromExcel(evt) {
    await this.excelService.readExcelWorkbook(evt);
    const table = this.excelService.readSheetData();
    const number = await this.excelParse.setProducts(table);
    if(number)
      alert('פרטי ' + number + ' מוצרים הוגדרו מתוך מטבלה');

  }


  async customerPricing(product: ProductPublicDoc) {
    if(this.businessService.side == 's') {
      const m = await this.modalCtrl.create({
        component: CustomerPricingModalComponent,
        componentProps: {product: product},
        backdropDismiss: false,
      });
      m.present();
    }
  }


  async deleteProduct(product: ProductPublicDoc) {

    if(await this.alerts.areYouSure('האם למחוק את המוצר ' + product.name + ' מהרשימה שלך?', 'פרטי המוצר יימחקו')) {
      await this.productsService.deleteProduct(product.id);
      this.search();
      return true;
    }

  }

  customerHasProduct(product) {
    return this.productsService.myProducts.some((p)=>p.id == product.id);
  }

  async onCheckProduct(product: ProductPublicDoc, evt) {
    // Save the product in the customer's private list
    if(evt.target.checked)
      await this.productsService.saveProduct(product);
    // Delete the product (if chose not to, check the checkbox back)
    else
      if(!await this.deleteProduct(product))
        evt.target.checked = true;

  }


  hasAllRequired(product: ProductCustomerDoc) {
    // All basic required fields
    let hasAll = !!(product.name && product.sid && product.catalogNumS && product.image && product.barcode && product.price);
    // Required field for unit types
    if(product.type > ProductType.BY_WEIGHT)
      hasAll = hasAll && !!product.unitWeight;
    // Required for customers
    if(this.businessService.side == 'c')
      hasAll = hasAll && !!product.category && !!product.catalogNumC;
    return hasAll;
  }

  priceInLimits(product: ProductCustomerDoc) {
    if(this.businessService.side == 'c')
      return (!product.minPrice || product.price >= product.minPrice) && (!product.maxPrice || product.price <= product.maxPrice);
    else
      return true;
  }


  async openPopoverMenu(product: ProductPublicDoc) {

    const buttons =  [
      {
        text: 'עריכת מוצר',
        icon: 'create',
        handler: ()=>this.navService.goToEditProduct(product.id),
      },
      {
        text: 'מחיקת מוצר',
        icon: 'trash',
        role: 'destructive',
        handler: ()=>this.deleteProduct(product),
      }
    ];

    if(this.businessService.side == 's' && this.canOfferPrice)
      buttons.push({
        text: 'תמחור לקוחות',
        icon: 'cash-outline',
        handler: ()=>this.customerPricing(product),
      });

    const a = await this.actionSheetCtrl.create({
      buttons: buttons,
    });
    a.present();
  }

}
