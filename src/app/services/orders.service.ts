import {Injectable} from '@angular/core';
import {OrderChange, OrderDoc, OrderStatus} from '../models/OrderI';
import {ProductsService} from './products.service';
import {formatNumber} from '@angular/common';
import * as firebase from 'firebase/app';
import 'firebase/firestore';
import 'firebase/functions';
import {SuppliersService} from './suppliers.service';
import {Order} from '../models/Order';
import {BusinessService} from './business.service';
import {AuthSoftwareService} from './auth-software.service';
import {CustomersService} from './customers.service';
import CollectionReference = firebase.firestore.CollectionReference;
import DocumentReference = firebase.firestore.DocumentReference;
import QuerySnapshot = firebase.firestore.QuerySnapshot;
import Query = firebase.firestore.Query;

@Injectable({
  providedIn: 'root'
})
export class OrdersService {

  /**
   * When a new order is being created, it gets a temporal ID (marked with suffix).
   * Only when the order is being saved for the first time, its ID becomes constant.
   * If someone else already created an order with this ID and saved it, the newer order will get a new different ID.
   * This method keeps the IDs sequential (not "wasting" numbers), in case someone created a draft but has not saved it.
   * */
  static readonly TEMP_SERIAL_SUFFIX = '*';

  readonly ordersRef = firebase.firestore().collection('orders');

  /** The reference to the firestore collection where the list of orders is stored */
  private _myOrders: OrderDoc[] = [];

  constructor(
    private authService: AuthSoftwareService,
    private productsService: ProductsService,
    private suppliersService: SuppliersService,
    private customersService: CustomersService,
    private businessService: BusinessService,
  ) {}

  get myOrders() : Query {
    return this.ordersRef.where(this.authService.currentUser.side + 'id','==',this.authService.currentUser.bid);
  }

  get myDrafts() : CollectionReference {
    return this.businessService.businessDocRef.collection('my_drafts');
  }

  get myOrdersMetadataRef() : DocumentReference {
    return this.businessService.businessDocRef.collection('metadata').doc('orders');
  }


  /**
   * Get all my orders, or filtered by query.
   * Can be filtered by:
   * - serial number (single result) - if the query text is a number,
   * - invoice number (single result) - if the query text fits the serial number format (yy-serial),
   * - supplier's name (multiple results) - if the query text is non-numeric & non-serial format string, *limited to up to 10 different suppliers fits to the query
   * - date range (multiple results) - inclusive,
   * for more than 10 results use pagination */
  async queryOrders(isDraft: boolean, query: string = '', dates?: Date[], lastDoc?: OrderDoc, firstDoc?: OrderDoc) : Promise<Order[]> {

    // Get the drafts collection or the orders collection
    const baseRef: CollectionReference | Query = isDraft ? this.myDrafts : this.myOrders;

    let ref;

    // If it's a number, search by invoice number (only one result)
    if(query && +query)
      ref = baseRef.where('invoice', '==', query).limit(1);

    // If it's in order serial format, search by order serial (only one result)
    if(query && OrdersService.CheckOrderIdFormat(query))
      ref = baseRef.where('serial','==', query).limit(1);

    // For other strings or no query, there might be more than 1 results
    if(!ref) {

      // Sort by supply time and by serial number, or by modification time for drafts
      if(isDraft)
        ref = baseRef.orderBy('modified');
      else
        ref = baseRef.orderBy('supplyTime').orderBy('serial');

      // For querying by dates (not for drafts), add date filter
      if(dates && !isDraft) {
        ref = ref.where('supplyTime','>=',dates[0].getTime());    // from date (inclusive)
        if(dates[1]) {
          dates[1].setDate(dates[1].getDate() + 1);
          ref = ref.where('supplyTime','<',dates[1].getTime());   // to date (exclusive)
        }
      }

      // if there is a text query, filter by supplier/customer name (first get supplier/customer ID, and then search by their IDs)
      if(query) {
        const businesses = this.businessService.side == 'c' ? this.suppliersService.getSupplierByName(query) : this.customersService.getCustomerByName(query);
        if(businesses.length > 0 && businesses.length <= 10) {
          const ids = businesses.map((d)=>d.id);
          ref = ref.where('sid','in', ids);
        }
        else
          return [];
      }

      // For pagination, start after the last (next page), or end before the first (previous page)
      if(lastDoc && !firstDoc)
        ref = ref.startAfter(isDraft ? lastDoc.modified : [lastDoc.supplyTime, lastDoc.serial]);
      if(firstDoc && !lastDoc)
        ref = ref.endBefore(isDraft ? lastDoc.modified : [lastDoc.supplyTime, lastDoc.serial]).limitToLast(10);
      else
        ref = ref.limit(10);

    }

    try {

      // Get results
      const res : QuerySnapshot = await ref.get();
      this._myOrders = res.docs.map((d)=>d.data() as OrderDoc);

      return this._myOrders.map((o)=>new Order(o));

    }
    catch (e) {
      console.error(e);
      return [];
    }

  }


  async getOrderById(id: string, isDraft: boolean) : Promise<Order> {

    // Get order from local list
    let doc = this._myOrders.find((o)=>o.id == id);

    // If not exist in local, get from server
    if(!doc) {
      const col = isDraft ? this.myDrafts : this.ordersRef;
      doc = (await col.doc(id).get()).data() as OrderDoc;
    }

    if(doc)
      return await new Order(doc);

  }


  /** Create new order object (draft) with temporal serial number and no ID (without saving on server yet) */
  async createNewOrder() : Promise<Order> {
    try {
      const metadata = (await this.myOrdersMetadataRef.get()).data();
      const tempSerial = OrdersService.createNewSerial(metadata ? metadata['lastSerial'] : '', true);
      return new Order({serial: tempSerial, created: Date.now()});
    }
    catch (e) {
      console.error(e);
    }
  }


  async deleteDraft(orderId: string) {
    if(orderId) {
      const order = await this.getOrderById(orderId, true);
      if(order) {
        try {
          await this.myDrafts.doc(orderId).delete();
        }
        catch (e) {
          console.error(e);
        }
      }
    }
  }


  async updateOrder(order: Order, newStatus?: OrderStatus) : Promise<OrderChange> {

    // If it's new order, save it as draft first
    if(!order.id)
      order = await this.saveDraft(order);

    // Get the order document
    const orderDoc = order.getDocument();

    // If new status requested, change the status in the document
    if(newStatus)
      orderDoc.status = newStatus;

    try {

      const updateOrder = firebase.functions().httpsCallable('updateOrder');
      const res = (await updateOrder(orderDoc)).data as OrderChange;

      // On success
      if(res) {

        // Delete the draft if it was draft
        if(order.status == OrderStatus.DRAFT)
          this.deleteDraft(order.id);

        // Get the new order status
        order.status = res.status;

        return res;
      }

    }
    catch (e) {
      console.error(e);
    }
  }


  /** Use transaction to get last order ID from the metadata, and create new ID */
  async saveDraft(order: Order) : Promise<Order> {

    const orderDoc = order.getDocument();

    return await firebase.firestore().runTransaction<Order>(async (transaction)=> {

      // For new order (no ID) create new ID and new serial
      if (!orderDoc.id) {

        // Get the last order serial from customer's metadata, and create new serial
        const metadata = (await transaction.get(this.myOrdersMetadataRef)).data();
        orderDoc.serial = OrdersService.createNewSerial(metadata ? metadata['lastSerial'] : '');

        // Reserve the new serial number, so the next ones will be the following numbers
        transaction.set(this.myOrdersMetadataRef, {lastSerial: orderDoc.serial}, {merge: true});

        // If the new serial is different from the temporal serial (minus the temporary suffix), notify the user
        if (orderDoc.serial != order.serial.slice(0, -OrdersService.TEMP_SERIAL_SUFFIX.length))
          alert('שים לב: מספר ההזמנה העדכני הוא: ' + orderDoc.serial);

        // Create new ID
        orderDoc.id = this.myDrafts.doc().id;

        // Increase number of searches for this supplier
        this.suppliersService.increaseSupplierSearch(order.sid);

      }

      // Save the order in drafts collection
      orderDoc.modified = firebase.firestore.Timestamp.now().toMillis();
      transaction.set(this.myDrafts.doc(orderDoc.id), orderDoc);

      return new Order(orderDoc);

    });

  }

  private static createNewSerial(lastSerial: string, isTemp?: boolean) : string {

    // Get the current year's last 2 digits
    const currentYear = new Date().getFullYear().toString().slice(-2);

    // Get the year [0] and the inner year serial number [1]
    const serialData = (lastSerial || '').split('-');

    // If the last order was in the same year, use its serial +1. If this order is the first of this year (or first at all), the serial is 1
    let serial = 1;
    if(serialData[0] == currentYear)
      serial = +serialData[1] + 1;

    // Format the order serial as: 'yy-{6 digit serial}'
    const newSerial = currentYear + '-' + (formatNumber(serial, 'en-US', OrdersService.OrderSerialNumOfDigits + '.0-0').replace(/,/g,''));
    return newSerial + (isTemp ? OrdersService.TEMP_SERIAL_SUFFIX : '');

  }

  /** Number of digits after '-' in order serial */
  static readonly OrderSerialNumOfDigits = 6;

  /** Check whether a string is in order serial format */
  static CheckOrderIdFormat(str: string) : boolean {

    const split = str.split('-');
    if(split.length != 2)
      return false;

    if(split[0].length != 2 || isNaN(+split[0]))
      return false;

    if(split[1].length < OrdersService.OrderSerialNumOfDigits || isNaN(+split[1]))
      return false;

    return true;

  }

}
