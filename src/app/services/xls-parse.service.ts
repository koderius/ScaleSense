import {Injectable} from '@angular/core';
import {SuppliersService} from './suppliers.service';
import {SupplierDoc} from '../models/Business';
import {Objects} from '../utilities/objects';
import {ProductsService} from './products.service';
import {BusinessService} from './business.service';
import {ProductCustomerDoc, ProductType} from '../models/ProductI';
import {CategoriesService} from './categories.service';

@Injectable({
  providedIn: 'root'
})
export class XlsParseService {

  constructor(
    private supplierService: SuppliersService,
    private productService: ProductsService,
    private businessService: BusinessService,
    private categoriesService: CategoriesService,
  ) { }

  async setSuppliers(table: string[][]) : Promise<number> {

    // Ignore the first row (header)
    table = table.slice(1);

    const promises = [];

    table.forEach((row)=>{

      // Get supplier's serial number, and check it's valid
      const nid = +row[0];
      if(!nid)
        return;

      // Create a document based on the NID
      const supplier: SupplierDoc = {nid: nid};

      // Get all other properties
      supplier.name = row[1];
      supplier.logo = row[2];
      supplier.companyId = row[3];
      supplier.address = row[4];
      supplier.businessPhone = row[5];
      supplier.fax = row[6];
      supplier.contacts = [
        {
          name: row[7],
          phone: row[8],
          email: row[9],
        },
        {
          name: row[10],
          phone: row[11],
          email: row[12],
        }
      ];

      Objects.ClearUndefined(supplier);

      try {
        promises.push(this.supplierService.saveSupplierDoc(supplier));
      }
      catch (e) {
        console.error(e);
      }

    });

    await Promise.all(promises);
    return promises.length;

  }


  async setProducts(table: string[][]) {

    // Ignore the first row (header)
    table = table.slice(1);

    const promises = [];

    table.forEach((row)=>{

      // Get supplier's catalog number. Supplier must have it
      const product: ProductCustomerDoc = {catalogNumS: row[0]};
      if(this.businessService.side == 's') {
        product.sid = this.businessService.myBid;
        if(!product.catalogNumS)
          return;
      }

      // For customer, get also the customer's catalog number, and get the supplier by his NID. Must have both
      if(this.businessService.side == 'c') {
        product.catalogNumC = row[11];
        const supplier = this.supplierService.mySuppliers.find((s)=>s.nid == +row[12]);
        if(supplier)
          product.sid = supplier.id;
        if(!product.catalogNumC || !product.sid)
          return;
      }

      // Get the rest of the data
      product.name = row[1];
      product.image = row[2];
      product.description = row[3];
      product.type = +row[4].slice(0,1) || 0;
      product.price = +row[5] || undefined;
      if(product.type > ProductType.BY_WEIGHT)
        product.unitWeight = +row[6] || undefined;

      product.tara = +row[7] || 0;
      product.barcode = +row[8] || undefined;

      product.isVeg = row[9].toUpperCase() == 'Y';
      if(product.isVeg)
        product.agriLink = row[10];

      // Customer ID is the current customer, or public if created by supplier
      product.cid = this.businessService.side == 'c' ? this.businessService.myBid : ProductsService.PUBLIC_PRODUCT_CID_VALUE;

      // Additional customer's properties
      if(this.businessService.side == 'c') {
        product.category = row[13] || undefined;
        product.minPrice = +row[14] || undefined;
        product.maxPrice = +row[15] || undefined;
        product.orderWeightTolerance = +row[16] || undefined;
        product.receiveWeightTolerance = +row[17] || undefined;
      }

      Objects.ClearUndefined(product);

      try {
        promises.push(this.productService.saveProduct(product));
      }
      catch (e) {
        console.error(e);
      }

    });

    await Promise.all(promises);
    return promises.length;

  }

}
