export type ProductOrder = {

  /** The productOrder ID */
  id: string;

  /** The amount to order */
  amount?: number;

  /** ProductDoc's comment (if there is) */
  comment?: string;

  /** ProductDoc's unit price. If not specified, the price is the default price as defined in the productOrder itself */
  pricePerUnit?: number;

}

export type OrderChange = {

  /** The ID of the user who made the change */
  by: string;

  /** Time of change */
  time: Date;

  /** The products that have been changed (ID + *relative* details, e.g: amount = -2, comment = 'Some new comment', etc...) */
  productsChanges: ProductOrder[];

}

export enum OrderStatus {

  DRAFT = 0,

  SENT = 10,
  OPENED = 11,
  APPROVED = 12,

  CHANGED_BY_SUPPLIER = 21,
  CHANGED_BY_CUSTOMER = 22,

  CANCELED_BY_SUPPLIER = 40,
  CANCELED_BY_CUSTOMER = 41,

  CLOSED = 100,

}

export interface OrderDoc {

  /** Order ID (yy-serial)*/
  id: string;

  /** Supplier ID */
  sid?: string;

  /** List of products to order (Each contains productOrder ID + order's details) */
  products?: ProductOrder[];

  /** General comment for the supplier about the order */
  comment?: string;

  /** Time of supply */
  supplyTime?: Date;

  /** Time of creation */
  created?: Date;

  /** List of changes */
  changes?: OrderChange[];

  /** Order status */
  status?: OrderStatus;

}

export class Order {

  constructor(private _props: OrderDoc) {}

  get id() {
    return this._props.id;
  }

  get sid() {
    return this._props.sid;
  }

  /** Supplier can be set only if there are no selected products */
  setSupplier(sid: string) {
    if(!this.products.length)
      this._props.sid = sid;
  }

  get comment() : string {
    return this._props.comment;
  }

  set comment(newComment: string) {
    this._props.comment = newComment;
  }

  get products() : ProductOrder[] {
    return this._props.products ? this._props.products.slice() : [];
  }

  getProductById(id: string) : ProductOrder {
    return this.products.find((p)=>p.id == id);
  }

  setProductAmount(id: string, newAmount: number, pricePerUnit: number) {
    if(newAmount > 0) {
      const product : ProductOrder = this.getProductById(id);
      if(product) {
        product.amount = newAmount;
        product.pricePerUnit = pricePerUnit;
      }
      else {
        if(!this._props.products)
          this._props.products = [];
        this._props.products.push({id: id, amount: newAmount, pricePerUnit: pricePerUnit});
      }
    }
    else if(newAmount === 0) {
      const idx = this.products.findIndex((p)=>p.id == id);
      if(idx > -1)
        this._props.products.splice(idx,1);
    }
  }

  orderTotalPrice() : number {
    let sum = 0;
    this.products.forEach((p)=>{sum += (p.pricePerUnit*p.amount)});
    return sum;
  }


  getDocument() : OrderDoc {
    return JSON.parse(JSON.stringify(this._props));
  }

}
