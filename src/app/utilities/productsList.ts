import {ProductOrder} from '../models/ProductI';

export type ProductsChange = {
  productId: string,
  type: 'added' | 'removed' | 'changed' | null,
  amount?: {old: number, new: number},
  price?: {old: number, new: number},
  comment?: {old: string, new: string},
}

export class ProductsListUtil {

  static CompareLists(oldList: ProductOrder[] = [], newList: ProductOrder[] = []) : ProductsChange[] {

    // Get a list of all the IDs of the products in both lists
    const allProducts = new Set<string>();
    [...oldList, ...newList].forEach((p)=>{allProducts.add(p.id || '')});

    // List of changes
    const changes: ProductsChange[] = [];

    // Compare all products
    allProducts.forEach((id)=>{

      const change: ProductsChange = {
        productId: id,
        type: null,
      };
      const oldProduct = oldList.find((p)=>p.id == id);
      const newProduct = newList.find((p)=>p.id == id);

      // Added, removed or changed
      if(oldProduct && !newProduct)
        change.type = 'removed';
      if(newProduct && !oldProduct)
        change.type = 'added';
      if(newProduct && oldProduct)
        change.type = 'changed';

      // Set changes properties (if there are)
      if(!newProduct || !oldProduct || newProduct.amount != oldProduct.amount)
        change.amount = {
          old: (oldProduct ? oldProduct.amount : null) || NaN,
          new: (newProduct ? newProduct.amount : null) || NaN,
        };
      if(!newProduct || !oldProduct || newProduct.priceInOrder != oldProduct.priceInOrder)
        change.price = {
          old: (oldProduct ? oldProduct.priceInOrder : null) || NaN,
          new: (newProduct ? newProduct.priceInOrder : null) || NaN,
        };
      if(!newProduct || !oldProduct || newProduct.comment != oldProduct.comment)
        change.comment = {
          old: (oldProduct ? oldProduct.comment : null) || '',
          new: (newProduct ? newProduct.comment : null) || '',
        };

      // Push to list only if there is some change
      if(change.amount || change.price || change.comment)
        changes.push(change);

    });

    return changes;

  }

}
