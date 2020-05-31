import { Component } from '@angular/core';
import {ProductsService} from '../services/products.service';
import {ProductCustomerDoc, ProductPublicDoc} from '../models/ProductI';
import {SuppliersService} from '../services/suppliers.service';
import {NavigationService} from '../services/navigation.service';
import {BusinessDoc} from '../models/Business';
import {BusinessService} from '../services/business.service';
import {XlsService} from '../services/xls.service';
import {ModalController} from '@ionic/angular';
import {CustomerPricingModalComponent} from '../customer-pricing-modal/customer-pricing-modal.component';
import {AlertsService} from '../services/alerts.service';
import {CustomersService} from '../services/customers.service';


@Component({
  selector: 'app-products-list',
  templateUrl: './products-list.page.html',
  styleUrls: ['./products-list.page.scss'],
})
export class ProductsListPage {

  businessList: BusinessDoc[] = [];

  q: string = '';
  bid: string;

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


  async readExcel(evt) {
    await this.excelService.readExcelWorkbook(evt);
    console.log(this.excelService.readSheetData());
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


}
