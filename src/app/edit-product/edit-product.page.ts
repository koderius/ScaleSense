import {Component, OnInit} from '@angular/core';
import {ProductCustomerDoc, ProductPublicDoc, ProductType} from '../models/ProductI';
import {ActivatedRoute} from '@angular/router';
import {ProductsService} from '../services/products.service';
import {FilesService} from '../services/files.service';
import {SuppliersService} from '../services/suppliers.service';
import {Enum} from '../utilities/enum';
import {AlertsService} from '../services/alerts.service';
import {CategoriesService} from '../services/categories.service';
import {BusinessService} from '../services/business.service';
import {Objects} from '../utilities/objects';
import {CameraService} from '../services/camera.service';
import {WeighService} from '../services/weigh.service';

@Component({
  selector: 'app-edit-product',
  templateUrl: './edit-product.page.html',
  styleUrls: ['./edit-product.page.scss'],
})
export class EditProductPage implements OnInit {

  // Current product being edited
  product: ProductCustomerDoc;

  // Product details before editing (for checking changes)
  oldProduct: ProductPublicDoc | ProductCustomerDoc;

  // Image file & file preview (base64) before uploading the image and getting its URL
  logoPreview: string;
  tempLogo: File;

  // List of product types
  productTypes = Enum.ListEnum(ProductType);

  // Form field whether the box included. Tara (box weight) will be entered only if not-included (false)
  taraIncluded: boolean = true;

  constructor(
    private activatedRoute: ActivatedRoute,
    private productsService: ProductsService,
    public suppliersService: SuppliersService,
    private alerts: AlertsService,
    public categoriesService: CategoriesService,
    public businessService: BusinessService,
    private cameraService: CameraService,
    private weighService: WeighService,
  ) {}

  get pageTitle() {
    if(this.product)
      return this.product.id ? 'עריכת מוצר' : 'הוספת מוצר';
  }

  async ngOnInit() {

    // Get ID from URL. if 'new', start new empty product, else, get the product data by the ID
    const id = this.activatedRoute.snapshot.params['id'];

    if(id == 'new') {
      // New product
      this.product = {type: ProductType.BY_WEIGHT};
      // Fill creator ID
      this.businessService.side == 'c' ? this.product.cid = this.businessService.myBid : this.product.sid = this.businessService.myBid;
      // For suppliers, set the product to be public for all customers
      if(this.businessService.side == 's')
        this.product.cid = ProductsService.PUBLIC_PRODUCT_CID_VALUE;
    }
    else
      this.product = await this.productsService.getProduct(id);

    // Save a copy of current data
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

  async getPicture() {
    if(this.cameraService.isCordova) {
      this.logoPreview = await this.cameraService.takePhoto();
      this.tempLogo = FilesService.CreateFile(this.logoPreview, this.product.name + '.jpg');
    }
    else {
      // TODO
      alert('כרגע אפשרי רק דרך מכשיר נייד')
    }
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
    if(await this.productsService.saveProduct(this.product, this.tempLogo)) {
      this.oldProduct = {...this.product};
      alert('נתוני מוצר נשמרו');
    }
    this.alerts.loaderStop(l);

  }


  checkFields() : boolean {

    // Check fields limits
    if((this.product.minPrice && this.product.minPrice > this.product.price) || (this.product.maxPrice && this.product.maxPrice < this.product.price)) {
      alert('מחיר מחוץ לטוווח שהוגדר');
      return false;
    }

    // Check all other fields validity (required fields)
    const inputs = document.querySelector('.form').getElementsByTagName('input');
    for (let i = 0; i < inputs.length; i++)
      if(!inputs.item(i).validity.valid) {
        alert('יש למלא את כל השדות המסומנים בכוכבית');
        return false;
      }

    return true;

  }


  async weigh(fieldName: string) {
    const weight = await this.weighService.openWeightModal(true);
    if(weight)
      this.product[fieldName] = weight;
  }

}
