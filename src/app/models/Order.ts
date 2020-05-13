import {OrderDoc, OrderStatus, ProductOrder} from './OrderI';

export class Order {

  constructor(private _props: OrderDoc) {

    // Set creation time (client time) - for new order
    if (!this._props.created)
      this._props.created = Date.now();

    // Set as draft - for new order
    if (!this._props.status)
      this._props.status = OrderStatus.DRAFT;

    this._props.adminAlerts = {
      n24Before: false,
      nAfter24: false,
    }

  }

  get id() {
    return this._props.id;
  }

  get serial() {
    return this._props.serial;
  }

  get sid() {
    return this._props.sid;
  }

  /** Supplier can be set only if there are no selected products */
  set sid(sid: string) {
    if (!this.products.length)
      this._props.sid = sid;
  }

  get cid() {
    return this._props.cid;
  }

  get comment(): string {
    return this._props.comment;
  }

  set comment(newComment: string) {
    this._props.comment = newComment;
  }

  get supplierComment(): string {
    return this._props.supplierComment;
  }

  set supplierComment(newComment: string) {
    this._props.supplierComment = newComment;
  }

  get products(): ProductOrder[] {
    return this._props.products ? this._props.products : [];
  }

  getProductById(id: string): ProductOrder {
    return this.products.find((p) => p.id == id);
  }

  setProductAmount(id: string, newAmount: number, pricePerUnit: number) {
    if (newAmount > 0) {
      const product: ProductOrder = this.getProductById(id);
      if (product) {
        product.amount = newAmount;
        product.pricePerUnit = pricePerUnit;
      }
      else {
        if (!this._props.products)
          this._props.products = [];
        this._props.products.push({id: id, amount: newAmount, pricePerUnit: pricePerUnit});
      }
    } else if (newAmount === 0) {
      const idx = this.products.findIndex((p) => p.id == id);
      if (idx > -1)
        this._props.products.splice(idx, 1);
      if(!this._props.products.length)
        delete this._props.products;
    }
  }

  clearProducts() {
    this._props.products.splice(0);
  }

  orderTotalPrice(): number {
    let sum = 0;
    this.products.forEach((p) => {
      sum += (p.pricePerUnit * p.amount)
    });
    return sum;
  }

  get status() {
    return this._props.status;
  }

  set status(status: OrderStatus) {
    this._props.status = status;
  }

  get created() {
    return this._props.created;
  }

  get modified() {
    return this._props.modified;
  }

  get supplyTime() {
    return this._props.supplyTime;
  }

  set supplyTime(date: number) {
    this._props.supplyTime = date;
  }

  get changes() {
    return this._props.changes ? this._props.changes.slice() : [];
  }

  get invoice() {
    return this._props.invoice;
  }

  set invoice(num: string) {
    this._props.invoice = ''+num;
  }

  get driverName() {
    return this._props.driverName;
  }

  set driverName(driverName: string) {
    this._props.driverName = driverName;
  }


  getDocument(): OrderDoc {
    return JSON.parse(JSON.stringify(this._props));
  }

}
