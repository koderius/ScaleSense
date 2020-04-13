import { Injectable } from '@angular/core';
import {Order, OrderDoc} from '../models/Order';
import {ProductsService} from './products.service';
import {formatNumber} from '@angular/common';
import * as firebase from 'firebase/app';
import 'firebase/firestore';
import 'firebase/functions';
import CollectionReference = firebase.firestore.CollectionReference;
import DocumentReference = firebase.firestore.DocumentReference;

@Injectable({
  providedIn: 'root'
})
export class OrdersService {

  // TODO: Get customer ID from service
  readonly CUSTOMER_ID = 'JktH9OOE44MVfTGbLOB4';

  private _myOrders: OrderDoc[] = [];

  constructor(
    private productsService: ProductsService,
  ) { }


  /** The reference to the firestore collection where the list of orders is stored */
  get myOrdersRef() : CollectionReference {
    return firebase.firestore().collection('customers').doc(this.CUSTOMER_ID).collection('myorders');
  }

  get myOrdersMetadataRef() : DocumentReference {
    return firebase.firestore().collection('customers').doc(this.CUSTOMER_ID).collection('metadata').doc('orders');
  }


  get myOrders() {
    return this._myOrders.map((o)=>new Order(o));
  }


  getOrderById(id: string) {
    const doc = this._myOrders.find((o)=>o.id == id);
    if(doc)
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
      await this.myOrdersRef.doc(order.id).set(order.getDocument(), {merge: true});
      return true;
    }
    catch (e) {
      console.error(e);
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
      newId = currentYear + '-' + (formatNumber(serial, 'en-US', '6.0-0').replace(/,/g,''));

      transaction.set(this.myOrdersMetadataRef,{lastId: newId}, {merge: true});

    });

    return newId;

  }

}
