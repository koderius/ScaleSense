import {Component, OnInit} from '@angular/core';
import {FullProductDoc, ProductType} from '../models/Product';
import {ActivatedRoute} from '@angular/router';
import {ProductsService} from '../services/products.service';
import {FilesService} from '../services/files.service';
import {SuppliersService} from '../services/suppliers.service';
import {Enum} from '../utilities/enum';
import {AlertsService} from '../services/alerts.service';
import {CategoriesService} from '../services/categories.service';
import {BusinessService} from '../services/business.service';
import {Objects} from '../utilities/objects';

@Component({
  selector: 'app-edit-product',
  templateUrl: './edit-product.page.html',
  styleUrls: ['./edit-product.page.scss'],
})
export class EditProductPage implements OnInit {

  product: FullProductDoc;

  oldProduct: FullProductDoc;

  logoPreview: string;
  tempLogo: File;

  productTypes = Enum.ListEnum(ProductType);

  taraIncluded: boolean = true;

  constructor(
    private activatedRoute: ActivatedRoute,
    private productsService: ProductsService,
    public suppliersService: SuppliersService,
    private alerts: AlertsService,
    public categoriesService: CategoriesService,
    public businessService: BusinessService,
  ) { }

  get pageTitle() {
    if(this.product)
      return this.product.id ? 'עריכת מוצר' : 'הוספת מוצר';
  }

  async ngOnInit() {

    // Get ID from URL. if 'new', start new empty product, else, get the product data by the ID
    const id = this.activatedRoute.snapshot.params['id'];
    if(id == 'new') {
      this.product = {};
      // For suppliers, auto fill the supplier ID, and set the product to be public for all customers
      if(this.businessService.side == 's') {
        this.product.sid = this.businessService.myBid;
        this.product.cid = ProductsService.PUBLIC_PRODUCT_CID_VALUE;
      }
    }
    else {
      this.product = (await this.productsService.loadProductsByIds(id))[0];
    }

    this.oldProduct = {...this.product};

    // If no tara weight, it means that the tara included
    this.taraIncluded = !this.product.tara;

    // Show the product image
    this.logoPreview = this.product.image;

  }


  hasChanges() : boolean {
    return !Objects.IsEqual(this.oldProduct, this.product);
  }


  async chooseLogo(file: File) {
    this.tempLogo = file;
    this.logoPreview = await FilesService.ReadFile(file);
  }

  clearLogo() {
    this.logoPreview = null;
    this.tempLogo = null;
    this.product.image = null;
  }

  async enterLink() {
    this.product.image = this.logoPreview = await this.alerts.inputAlert('', 'הדבק קישור לתמונה');
  }


  async save() {

    if(!this.hasChanges())
      return;

    if(this.taraIncluded)
      delete this.product.tara;

    if(!this.checkFields())
      return;

    // Save the product (different methods for supplier and customer) - including upload the image file
    const l = this.alerts.loaderStart('שומר פרטי מוצר...');

    if(this.businessService.side == 'c')
      await this.productsService.saveCustomerProduct(this.product, this.tempLogo);
    else
      await this.productsService.saveProductPublicData(this.product, this.tempLogo);

    this.alerts.loaderStop(l);

    this.oldProduct = {...this.product};

    alert('נתוני מוצר נשמרו');

  }


  checkFields() : boolean {

    if(!this.product.name || !this.product.sid || !this.product.catalogNumS || !this.product.image || !this.product.barcode || !this.product.price) {
      alert('יש למלא את כל השדות המסומנים בכוכבית');
      return false;
    }

    if(this.businessService.side == 'c' && (!this.product.catalogNumC || !this.product.category)) {
      alert('יש למלא את כל השדות המסומנים בכוכבית');
      return false;
    }

    if(!this.taraIncluded && !this.product.tara) {
      alert('אם משקל האריזה אינו כלול במשקל המוצר, יש למלא את משקל האריזה');
      return false;
    }

    if(this.product.type && !this.product.unitWeight) {
      alert('אם סוג המוצר אינו לפי משקל, יש למלא את משקל היחידה');
      return false;
    }

    return true;

  }

}
