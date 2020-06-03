import {Component} from '@angular/core';
import {ProductsService} from '../services/products.service';
import {ProductCustomerDoc, ProductPublicDoc, ProductType} from '../models/ProductI';
import {SuppliersService} from '../services/suppliers.service';
import {NavigationService} from '../services/navigation.service';
import {BusinessDoc} from '../models/Business';
import {BusinessService} from '../services/business.service';
import {XlsService} from '../services/xls.service';
import {ModalController} from '@ionic/angular';
import {CustomerPricingModalComponent} from '../customer-pricing-modal/customer-pricing-modal.component';
import {AlertsService} from '../services/alerts.service';
import {CustomersService} from '../services/customers.service';
import {XlsParseService} from '../services/xls-parse.service';


@Component({
  selector: 'app-products-list',
  templateUrl: './products-list.page.html',
  styleUrls: ['./products-list.page.scss'],
})
export class ProductsListPage {

  businessList: BusinessDoc[] = [];

  q: string = '';
  bid: string;

  // For supplier, always true.
  // For customer, setting to false will show all the supplier's products (and not only those he has in his list)
  favoriteOnly: boolean = true;

  numOfNewResults: number;

  isSearching: boolean;

  constructor(
    private productsService: ProductsService,
    private suppliersService: SuppliersService,
    private customersService: CustomersService,
    public navService: NavigationService,
    public businessService: BusinessService,
    private excelService: XlsService,
    private excelParse: XlsParseService,
    private modalCtrl: ModalController,
    private alerts: AlertsService,
  ) { }

  get productsList() : ProductPublicDoc[] | ProductCustomerDoc[] {
    return this.productsService.loadedProducts;
  }

  ionViewDidEnter() {

    // For customers, allow filter by supplier. for supplier allow filter by customer
    this.businessList = this.businessService.side == 'c' ? this.suppliersService.mySuppliers : this.customersService.myCustomers;

    this.search();

  }

  /**
   * Get orders by search query.
   * page = 0 (default) - new search
   * page = 1 - next page
   * page = -1 - previous page
   * */
  async search(movePage : number = 0) {

    this.isSearching = true;

    // Get results
    const res = await this.productsService.queryMyProducts(
      this.q,
      this.bid,
      !this.favoriteOnly,
      true,
      movePage == 1 ? this.productsList.slice(-1)[0].name : null,
      movePage == -1 ? this.productsList[0].name : null,
    );

    // Report to pagination
    this.numOfNewResults = res ? res.length : 0;

    this.isSearching = false;

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

    if(await this.alerts.areYouSure('האם למחוק את המוצר ' + product.name + '?', 'פרטי המוצר יימחקו'))
      await this.productsService.deleteProduct(product.id);

    this.search();

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


}
