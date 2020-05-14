import {Objects} from '../utilities/objects';
import {FullProductDoc, ProductCustomerDoc, ProductPublicDoc} from './Product';

/** Theses methods handle merging and splitting the product's document(s) */
export class ProductFactory {

  /** Split the full product's data into public and private data before saving it on the server.
   * Notice that the private price is not being set by the customer, and therefore not being saved in the private data
   * */
  static SplitProduct(product: FullProductDoc) : {public: ProductPublicDoc, private: ProductCustomerDoc} {

    // Get all the private customer data
    let privateData: ProductCustomerDoc = {
      catalogNumC: product.catalogNumC,
      category: product.category,
      priceLimit: product.priceLimit,
      priceTolerance: product.priceTolerance,
      orderWeightTolerance: product.orderWeightTolerance,
      customerModified: product.customerModified,
    };

    // Get the public data document and remove the private data from it
    const publicData: ProductPublicDoc = {...product};
    for (let p in privateData)
      delete publicData[p];

    // Add the common data to the private document
    privateData = {...privateData, ...ProductFactory.CommonData(product)};
    // And clear undefined values
    Objects.ClearFalsy(privateData);

    return {public: publicData, private: privateData};

  }


  /** Merging public data and private customer data when the customer loads the product from the server
   *  Return a merged full product document, so the the private data will override the public data where collied
   *  - important for price property, the private price is the real price */
  static MergeProduct(publicData: ProductPublicDoc, privateData: ProductCustomerDoc) : FullProductDoc {
    return {...publicData, ...privateData};
  }


  /** Public data that exists also in the private document for querying and recognition
   * ID - foreign key
   * SID - supplier ID, for querying by supplier
   * Name - Product's name, for querying by name
   * */
  static CommonData(product: FullProductDoc) {
    return {
      id: product.id,
      sid: product.sid,
      name: product.name,
    }
  }

}
