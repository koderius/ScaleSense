import {Injectable} from '@angular/core';
import {OrderDoc, OrderStatus} from '../models/OrderI';
import {formatNumber} from '@angular/common';
import * as firebase from 'firebase/app';
import 'firebase/firestore';
import 'firebase/functions';
import {SuppliersService} from './suppliers.service';
import {Order} from '../models/Order';
import {BusinessService} from './business.service';
import {CustomersService} from './customers.service';
import CollectionReference = firebase.firestore.CollectionReference;
import DocumentReference = firebase.firestore.DocumentReference;
import QuerySnapshot = firebase.firestore.QuerySnapshot;
import Query = firebase.firestore.Query;
import {Dictionary} from '../utilities/dictionary';
import {ProductOrder} from '../models/ProductI';
import {Objects} from '../utilities/objects';
import {isNumber} from 'util';
import {OrderChange} from '../models/Changes';

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

  readonly splitOrdersRef = this.businessService.businessDocRef.collection('split_orders');

  /** The reference to the firestore collection where the list of orders is stored */
  private _myOrders: OrderDoc[] = [];

  constructor(
    private suppliersService: SuppliersService,
    private customersService: CustomersService,
    private businessService: BusinessService,
  ) {}

  get myOrders() : Query {
    const bidPropName = this.businessService.side + 'id';
    const myBid = this.businessService.myBid;
    return this.ordersRef.where(bidPropName,'==',myBid);
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
   * - invoice number - if the query text is a number (longer than 3 digits),
   * - serial number - if the query text starts with number and has '-' in the 3rd place,
   * - supplier's name - if the query text is non-numeric & does not fit to serial check, *limited to up to 10 different suppliers fits to the query
   * - date range - inclusive,
   * - statuses - can filter by up to 10 different statuses - more than 10 will get all
   * for more than 10 results use pagination */
  async queryOrders(isDraft: boolean, query: string = '', statusGroup?: OrderStatus[], dates?: Date[], reverse?: boolean, lastDoc?: OrderDoc, firstDoc?: OrderDoc) : Promise<Order[]> {

    // Get the drafts collection or the orders collection
    const baseRef: CollectionReference | Query = isDraft ? this.myDrafts : this.myOrders;

    let ref;

    // If it's a number longer than 2 digits, search by invoice number
    if(query && +query && query.length > 2)
      ref = baseRef.where('invoice', '>=', query).where('invoice', '<', Dictionary.NextLastLetter(query));

    // If the first char is a number and 3rd is '-', try to search by serial number
    if(query && +query[0] && query[2] == '-')
      ref = baseRef.where('serial','>=', query).where('serial', '<', Dictionary.NextLastLetter(query));

    // For other strings or no query:
    if(!ref) {

      // Sort by supply time and by serial number,

      // For drafts, sort by modification time
      if(isDraft)
        ref = baseRef.orderBy('modified', 'desc');

      // For orders, sort by supply time and then by serial number. other possible queries are SID, CID and status
      else
        ref = baseRef.orderBy('supplyTime', reverse ? 'desc' : 'asc').orderBy('serial', reverse ? 'desc' : 'asc');

      // For querying by dates (not for drafts), add date filter
      if(dates && !isDraft) {
        ref = ref.where('supplyTime','>=',dates[0].getTime());    // from date (inclusive)
        if(dates[1]) {
          dates[1].setDate(dates[1].getDate() + 1);
          ref = ref.where('supplyTime','<',dates[1].getTime());   // to date (exclusive)
        }
      }

      // For querying by group of statuses
      if(statusGroup && statusGroup.length && statusGroup.length <= 10 && !isDraft)
        ref = ref.where('status', 'in', statusGroup);

      // if there is a text query, filter by supplier/customer name (first get supplier/customer ID, and then search by their IDs)
      if(query) {
        const businesses = this.businessService.side == 'c' ? this.suppliersService.getSupplierByName(query) : this.customersService.getCustomerByName(query);
        if(businesses.length == 1) {
          const id = businesses[0].id;
          const prop = this.businessService.side == 'c' ? 'sid' : 'cid';
          ref = ref.where(prop,'==', id);
        }
        else
          return [];
      }

      // For pagination, start after the last (next page), or end before the first (previous page)
      if(lastDoc && !firstDoc)
        ref = isDraft ? ref.startAfter(lastDoc.modified) : ref.startAfter(lastDoc.supplyTime, lastDoc.serial);
      if(firstDoc && !lastDoc)
        ref = (isDraft ? ref.endBefore(firstDoc.modified) : ref.endBefore(firstDoc.supplyTime, firstDoc.serial)).limitToLast(10);
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


  async updateOrder(order: Order, newStatus?: OrderStatus, isRetry?: boolean) : Promise<OrderChange> {

    // If it's new order, save it as draft first
    if(!order.id)
      order = await this.saveDraft(order);

    // Get the order document
    const orderDoc = order.getDocument();

    // If new status requested, change the status in the document
    if(newStatus)
      orderDoc.status = newStatus;

    try {

      const updateOrder = firebase.functions().httpsCallable('updateOrder2');
      const res = (await updateOrder(orderDoc)).data as OrderChange;

      // On success
      if(res) {

        // Delete the draft if it was draft
        if(order.status == OrderStatus.DRAFT)
          this.deleteDraft(order.id);

        // Get the new order status
        order.status = res.newStatus;

        return res;
      }

    }
    catch (e) {
      if(!isRetry) {
        console.log('Retry...');
        return await this.updateOrder(order, newStatus, true);
      }
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


  /** Get and set split order products data (for reception) */
  async getSplitOrder(orderId: string) : Promise<ProductOrder[]> {
    try {
      const doc = (await this.splitOrdersRef.doc(orderId).get()).data();
      return doc ? doc.products : null;
    }
    catch (e) {
      console.error(e);
    }
  }

  async setSplitOrder(order: Order) : Promise<boolean> {
    try {
      // Save only the products that has been changed/weighed during the reception
      const productsToSave = order.products.filter((p)=>isNumber(p.finalWeight) || p.priceChangedInReception || p.amountChangedInReception);
      productsToSave.forEach((p)=>Objects.ClearUndefined(p));
      await this.splitOrdersRef.doc(order.id).set({products: productsToSave}, {merge: true});
      return true;
    }
    catch (e) {
      console.error(e);
    }
  }

  async deleteSplitOrder(order: Order) {
    const ref = this.splitOrdersRef.doc(order.id);
    try {
      if((await ref.get()).exists)
        await ref.delete();
    }
    catch (e) {
      console.error(e);
    }
  }

}


