import { Injectable } from '@angular/core';
import * as firebase from 'firebase/app';
import 'firebase/firestore';
import CollectionReference = firebase.firestore.CollectionReference;
import {AuthSoftwareService} from './auth-software.service';
import {BusinessDoc, BusinessSide} from '../models/Business';

/**
 * This service loads the business (customer or supplier) document according to the user data, and keep subscribing for changes in the document
 */

@Injectable({
  providedIn: 'root'
})
export class BusinessService {

  readonly customersCollection = firebase.firestore().collection('customers');
  readonly suppliersCollection = firebase.firestore().collection('suppliers');

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
    return this._businessDoc;
  }

  constructor(private authService: AuthSoftwareService) {

    // Subscribe business document
    this.businessDocRef.onSnapshot((snapshot)=>{
      this._businessDoc = snapshot.data();
    });

  }

  /** Get promise for a data document of any business */
  async getBusinessDoc(side: BusinessSide, bid: string) : Promise<BusinessDoc> {
    let ref = side == 'c' ? this.customersCollection : this.suppliersCollection;
    return (await ref.doc(bid).get()).data();
  }

}
