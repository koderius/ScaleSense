import {BusinessSide} from './Business';
import {OrderDoc, OrderStatus} from './OrderI';
import {ProductType} from './ProductI';
import {UserDoc} from './UserDoc';

export type ProductChange = {
  id: string;
  name: string;
  type: ProductType;
  change?: 'added' | 'deleted' | 'changed';
  amount?: {from: number, to: number};
  price?: {from: number, to: number};
  newComment?: string;
}

export class OrderChange {
  time?: number = Date.now();
  side?: BusinessSide;
  uid?: string;
  username?: string;
  hasChanges?: boolean = false;
  productsChanges?: ProductChange[];
  supplyTime?: {from: number, to: number};
  newComment?: string;
  newSupplierComment?: string;
  totalPrice?: {from: number, to: number};
  newStatus?: OrderStatus;
}


export class OrderChangeFactory extends OrderChange {

  // The value of deleted comment
  static readonly CommentDeleted = '#DEL;';

  constructor(public newOrder: OrderDoc, public oldOrder?: OrderDoc) {
    super();
    // Check changes (if it's an already exist order)
    if(oldOrder) {
      this.compareOrderProps();
      this.compareProducts();
    }
  }


  setUser(user: UserDoc) {
    this.side = user.side || 'c';
    this.uid = user.uid || '';
    this.username = user.displayName || '';
  }


  compareOrderProps() {

    if(this.oldOrder.supplyTime != this.newOrder.supplyTime)
      this.supplyTime = {from: this.oldOrder.supplyTime || 0, to: this.newOrder.supplyTime || 0};

    if(this.oldOrder.comment != this.newOrder.comment) {
      this.newComment = this.newOrder.comment;
      if(this.oldOrder.comment && !this.newOrder.comment)
        this.newComment = OrderChangeFactory.CommentDeleted;
    }

    if(this.oldOrder.supplierComment != this.newOrder.supplierComment) {
      this.newSupplierComment = this.newOrder.supplierComment;
      if(this.oldOrder.supplierComment && !this.newOrder.supplierComment)
        this.newSupplierComment = OrderChangeFactory.CommentDeleted;
    }

    if(this.supplyTime || this.newComment || this.newSupplierComment)
      this.hasChanges = true;

  }


  compareProducts() {

    this.productsChanges = [];

    // Get all products IDs
    const allProductsIds = new Set<string>([
      ...(this.oldOrder.products || []).map((p)=>p.id || ''),
      ...(this.newOrder.products || []).map((p)=>p.id || '')
    ]);

    // For each product
    allProductsIds.forEach((id: string)=>{

      // Products to compare
      const oldProduct = (this.oldOrder.products || []).find((p)=>p.id == id);
      const newProduct = (this.newOrder.products || []).find((p)=>p.id == id);

      // Product changes object
      const change: ProductChange = {
        id: (newProduct || oldProduct).id || '',
        name: (newProduct || oldProduct).name || '',
        type: (newProduct || oldProduct).type || 0,
      };
      const l = Object.keys(change).length;

      // For deleted product
      if(oldProduct && !newProduct)
        change.change = 'deleted';

      // For new product
      else if(!oldProduct && newProduct) {
        change.change = 'added';
        change.amount = {from: 0, to: newProduct.amount || 0};
      }

      // For updated product
      else {

        if(newProduct.amount != oldProduct.amount)
          change.amount = {from: oldProduct.amount, to: newProduct.amount};
        if(newProduct.priceInOrder != oldProduct.priceInOrder)
          change.price = {from: oldProduct.priceInOrder, to: newProduct.priceInOrder};
        if(newProduct.comment != oldProduct.comment)
          change.newComment = newProduct.comment || OrderChangeFactory.CommentDeleted;

        if(Object.keys(change).length > l)
          change.change = 'changed'

      }

      // Save the product's changes
      if(change.change)
        this.productsChanges.push(change);

    });

    if(this.productsChanges.length) {
      this.hasChanges = true;
      this.calcTotalPrice();
    }
    else
      delete this.productsChanges;

  }


  calcTotalPrice() {

    [this.oldOrder, this.newOrder].forEach((order, i)=>{

      let sum = 0;
      order.products.forEach((p)=>{
        sum += (p.priceInOrder * p.amount);
      });

      if(i === 0)
        this.totalPrice = {from: sum, to: null};
      else
        this.totalPrice.to = sum;

    });

    if(this.totalPrice.from == this.totalPrice.to)
      delete this.totalPrice;

  }


  toDoc() : OrderChange {

    const doc = {
      time: this.time,
      side: this.side,
      uid: this.uid,
      username: this.username,
      hasChanges: this.hasChanges,
      productsChanges: this.productsChanges,
      supplyTime: this.supplyTime,
      newComment: this.newComment,
      newSupplierComment: this.newSupplierComment,
      totalPrice: this.totalPrice,
      newStatus: this.newStatus,
    };

    for (let p in doc)
      if(!doc[p])
        delete doc[p];

    return doc;

  }

}
