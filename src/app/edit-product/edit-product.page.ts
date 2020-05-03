import {Component, OnInit} from '@angular/core';
import {ProductCustomer, ProductDoc, ProductType} from '../models/Product';
import {ActivatedRoute} from '@angular/router';
import {ProductsService} from '../services/products.service';
import {FilesService} from '../services/files.service';
import {SuppliersService} from '../services/suppliers.service';
import {Enum} from '../utilities/enum';
import {AlertsService} from '../services/alerts.service';

@Component({
  selector: 'app-edit-product',
  templateUrl: './edit-product.page.html',
  styleUrls: ['./edit-product.page.scss'],
})
export class EditProductPage implements OnInit {

  product: ProductDoc;
  myProductData: ProductCustomer;

  logoPreview: string;
  tempLogo: File;

  productTypes = Enum.ListEnum(ProductType);

  taraIncluded: boolean = true;

  constructor(
    private activatedRoute: ActivatedRoute,
    private productsService: ProductsService,
    public suppliersService: SuppliersService,
    private alerts: AlertsService,
  ) { }

  get pageTitle() {
    if(this.product)
      return this.product.id ? 'עריכת מוצר' : 'הוספת מוצר';
  }

  async ngOnInit() {

    const id = this.activatedRoute.snapshot.params['id'];
    if(id == 'new') {
      this.product = {};
      this.myProductData = {};
    }
    else {
      this.myProductData = (await this.productsService.myProductsRef.doc(id).get()).data() as ProductCustomer;
      this.product = (await this.productsService.allProductsRef.doc(id).get()).data() as ProductDoc;
    }

    this.taraIncluded = !this.product.tara;

    this.logoPreview = this.product.image;

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

    if(this.taraIncluded)
      delete this.product.tara;

    if(!this.checkFields())
      return;

    // Save the supplier. If there is a temporary file, upload it. If the supplier has a logo but it was clear, delete the logo from server
    const l = this.alerts.loaderStart('שומר פרטי מוצר...');
    await this.productsService.saveProduct(this.product, this.myProductData, this.tempLogo);
    this.alerts.loaderStop(l);

  }


  checkFields() : boolean {

    if(!this.product.name || !this.product.sid || !this.product.catalogNumS || !this.myProductData.catalogNumC || !this.product.image || !this.product.barcode || !this.product.price || this.myProductData.category) {
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
