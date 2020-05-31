import {ProductCustomerDoc, ProductPublicDoc} from './ProductI';

export class Product {

  static ToPublic(productDoc: ProductCustomerDoc) : ProductPublicDoc {

    // Delete all customer's private data
    delete productDoc.receiveWeightTolerance;
    delete productDoc.orderWeightTolerance;
    delete productDoc.maxPrice;
    delete productDoc.minPrice;
    delete productDoc.catalogNumC;
    delete productDoc.category;
    delete productDoc.customerModified;

    return productDoc as ProductPublicDoc;

  }

  static ToCustomer(productDoc: ProductPublicDoc) : ProductCustomerDoc {
    return productDoc as ProductCustomerDoc;
  }

}
