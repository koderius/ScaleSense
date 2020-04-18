import {Injectable} from '@angular/core';
import {Order, OrderDoc, OrderStatus} from '../models/Order';
import {ProductsService} from './products.service';
import {formatNumber} from '@angular/common';
import * as firebase from 'firebase/app';
import 'firebase/firestore';
import 'firebase/functions';
import {SuppliersService} from './suppliers.service';
import CollectionReference = firebase.firestore.CollectionReference;
import DocumentReference = firebase.firestore.DocumentReference;
import Query = firebase.firestore.Query;
import DocumentSnapshot = firebase.firestore.DocumentSnapshot;
import QuerySnapshot = firebase.firestore.QuerySnapshot;

@Injectable({
  providedIn: 'root'
})
export class OrdersService {

  // TODO: Get customer ID from service
  readonly CUSTOMER_ID = 'JktH9OOE44MVfTGbLOB4';

  private _myOrders: OrderDoc[] = [];

  constructor(
    private productsService: ProductsService,
    private suppliersService: SuppliersService,
  ) {

    // Subscribe list of orders
    try {
      const unsubscribe = this.myOrdersRef.onSnapshot((snapshot)=>{
        this._myOrders = snapshot.docs.map((d)=>d.data() as OrderDoc);
      })
    }
    catch (e) {
      console.error(e);
    }

  }


  /** The reference to the firestore collection where the list of orders is stored */
  get myOrdersRef() : CollectionReference {
    return firebase.firestore().collection('customers').doc(this.CUSTOMER_ID).collection('myorders');
  }

  get myOrdersMetadataRef() : DocumentReference {
    return firebase.firestore().collection('customers').doc(this.CUSTOMER_ID).collection('metadata').doc('orders');
  }


  /** Get all my orders, or filtered by query. for more than 10 results use pagination */
  async getMyOrders(isDraft: boolean, query: string = '', dates?: Date[], lastDoc?: OrderDoc, firstDoc?: OrderDoc) : Promise<Order[]> {

    let ref : DocumentReference | Query;

    // If it's a number, search by invoice number
    if(query && +query)
      ref = this.myOrdersRef.where('invoice', '==', query).where('draft','==',isDraft);

    // If it's in order ID format, search by order ID (later check that the draft property is fit)
    let byId = false;
    if(query && OrdersService.CheckOrderIdFormat(query)) {
      ref = this.myOrdersRef.doc(query);
      byId = true;
    }

    // For other strings or no query, there might be more than 1 results
    if(!ref) {

      // Sort by time and by ID, and check draft/non-draft
      const sortBy = isDraft ? 'modified' : 'supplyTime';
      ref = this.myOrdersRef.orderBy(sortBy).orderBy('id').where('draft','==',isDraft);

      // For querying by dates (instead of query by text)
      if(dates && dates.length == 2 && !isDraft) {
        query = null;
        dates[1].setDate(dates[1].getDate() + 1);
        ref = ref.where('supplyTime','>=',dates[0].getTime()).where('supplyTime','<',dates[1].getTime());
      }

      // if there is a text query, search by supplier name (first get suppliers ID, and then search by their IDs)
      if(query) {
        const suppliers = this.suppliersService.getSupplierByName(query);
        if(suppliers.length > 0 && suppliers.length <= 10) {
          const ids = suppliers.map((d)=>d.id);
          ref = ref.where('sid','in', ids);
        }
        else
          return [];
      }

      // For pagination, start after the last (next page), or end before the first (previous page)
      if(lastDoc && !firstDoc)
        ref = ref.startAfter(lastDoc[sortBy], lastDoc.id);
      if(firstDoc && !lastDoc)
        ref = ref.endBefore(firstDoc[sortBy], firstDoc.id).limitToLast(10);
      else
        ref = ref.limit(10);

    }

    try {

      // Get results
      const res : DocumentSnapshot | QuerySnapshot = await ref.get();

      // For document by ID, return its data, if it is fit to the draft query
      if(byId && res instanceof DocumentSnapshot) {
        if(!res.exists)
          return [];
        const data = res.data() as OrderDoc;
        if(data.draft)
          this._myOrders = [data];
      }

      if(!byId && res instanceof QuerySnapshot) {
        // For other queries, return the documents data
        this._myOrders = res.docs.map((d)=>d.data() as OrderDoc);
      }

      return this._myOrders.map((o)=>new Order(o));

    }
    catch (e) {
      console.error(e);
    }

  }


  async getOrderById(id: string) : Promise<Order> {

    // Get order from local list
    let doc = this._myOrders.find((o)=>o.id == id);

    // If not exist in local, get from server
    if(!doc)
      doc = (await this.myOrdersRef.doc(id).get()).data() as OrderDoc;

    return new Order(doc);

  }


  /** Create new ID and create new order object (without saving on server yet)
   * (Maybe the ID should be created only after saving the order) */
  async createNewOrder() : Promise<Order> {

    const newId = await this.setNewOrderId();

    return new Order({id: newId});

  }


  /** Save order */
  async saveOrder(order: Order) : Promise<boolean> {
    try {
      await this.myOrdersRef.doc(order.id).set({

          // Save all properties
          ...order.getDocument(),

          // Update last time modified to current time
          modified: firebase.firestore.Timestamp.now().toMillis(),

          // Set as draft (for querying only)
          draft: order.status == OrderStatus.DRAFT,

        },
        {merge: true});
      return true;
    }
    catch (e) {
      console.error(e);
    }
  }


  async deleteDraft(orderId: string) {
    const order = await this.getOrderById(orderId);
    if(order && order.status == OrderStatus.DRAFT) {
      try {
        await this.myOrdersRef.doc(orderId).delete();
      }
      catch (e) {
        console.error(e);
      }
    }
  }


  async sendOrder(orderId: string) : Promise<boolean> {
    const sendOrder = firebase.functions().httpsCallable('sendOrder');
    try {
      return (await sendOrder(orderId)).data;
    }
    catch (e) {
      console.error(e);
    }
  }


  cancelOrder(orderId: string) {
    // TODO: Cloud function
  }


  /** Use transaction to get last order ID from the metadata, and create new ID */
  private async setNewOrderId() : Promise<string> {

    // Get the current year's last 2 digits
    const currentYear = new Date().getFullYear().toString().slice(-2);

    let newId;

    await firebase.firestore().runTransaction(async (transaction)=>{

      // Get the last order ID from customer's metadata
      const metadata = (await transaction.get(this.myOrdersMetadataRef)).data();
      const lastId = (metadata && metadata['lastId']) ? metadata['lastId'] : '';

      // Get the year [0] and the inner year serial number [1]
      const idData = lastId.split('-');

      // If the last order was in the same year, use its serial +1. If this order is the first of this year (or first at all), the serial is 1
      let serial = 1;
      if(idData[0] == currentYear)
        serial = +idData[1] + 1;

      // Format the order ID as: 'yy-{6 digit serial}'
      newId = currentYear + '-' + (formatNumber(serial, 'en-US', OrdersService.OrderIdNumOfDigits + '.0-0').replace(/,/g,''));

      transaction.set(this.myOrdersMetadataRef,{lastId: newId}, {merge: true});

    });

    return newId;

  }

  /** Number of digits after '-' in order ID */
  static readonly OrderIdNumOfDigits = 6;

  /** Check whether a string is in order ID format */
  static CheckOrderIdFormat(str: string) : boolean {

    const split = str.split('-');
    if(split.length != 2)
      return false;

    if(split[0].length != 2 || isNaN(+split[0]))
      return false;

    if(split[1].length != OrdersService.OrderIdNumOfDigits || isNaN(+split[1]))
      return false;

    return true;

  }

}
