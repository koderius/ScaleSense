import { Injectable } from '@angular/core';
import * as firebase from 'firebase/app';
import 'firebase/firestore';
import CollectionReference = firebase.firestore.CollectionReference;
import {BusinessDoc, BusinessSide} from '../models/Business';
import {AuthService} from './auth.service';
import {UserDoc} from '../models/UserDoc';

/**
 * This service loads the business (customer or supplier) document according to the user data, and keep subscribing for changes in the document
 */

@Injectable({
  providedIn: 'root'
})
export class BusinessService {

  readonly customersCollection = firebase.firestore().collection('customers');
  readonly suppliersCollection = firebase.firestore().collection('suppliers');
  readonly newCustomersCollection = firebase.firestore().collection('customers_new');
  readonly newSuppliersCollection = firebase.firestore().collection('suppliers_new');

  private businessSubscription;

  private _businessDoc: BusinessDoc;

  get businessCollectionRef(): CollectionReference {
    if(this.authService.currentUser) {
      switch (this.authService.currentUser.side) {
        case 'c': return this.customersCollection;
        case 's': return this.suppliersCollection;
      }
    }
    else
      return null;
  }

  get businessDocRef() {
    if(this.authService.currentUser)
      return this.businessCollectionRef.doc(this.authService.currentUser.bid);
    else
      return null;
  }

  get myBid() {
    return this.businessDocRef.id;
  }

  get side() {
    return this.authService.currentUser.side;
  }

  get businessDoc() : BusinessDoc {
    return JSON.parse(JSON.stringify(this._businessDoc || {})) as BusinessDoc;
  }

  constructor(private authService: AuthService) {

    // When user signed in/out
    this.authService.onCurrentUser.subscribe((user: UserDoc)=>{

      // Stop previous subscription
      if(this.businessSubscription)
        this.businessSubscription();

      // Subscribe business document (on sign-in)
      if(user)
        this.businessSubscription = this.businessDocRef.onSnapshot((snapshot)=>{
          this._businessDoc = snapshot.data();
        });
      // Reset business document (on sign-out)
      else
        this._businessDoc = null;

    });

  }

  // Load some business data
  async getBusinessDoc(side: BusinessSide, bid: string) : Promise<BusinessDoc> {
    let ref = side == 'c' ? this.customersCollection : this.suppliersCollection;
    return (await ref.doc(bid).get()).data();
  }

  // Get new business's name according to it's ID
  async getNewBusiness(bid: string, side: BusinessSide) : Promise<BusinessDoc> {
    const snap = await (side == 'c' ? this.newCustomersCollection : this.newSuppliersCollection).doc(bid).get();
    const doc = snap.data() as BusinessDoc;
    if(!doc.contacts)
      doc.contacts = [{},{}];
    if(!doc.contacts[1])
      doc.contacts[1] = {};
    return doc;
  }

}
