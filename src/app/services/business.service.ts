import { Injectable } from '@angular/core';
import {AuthService} from './auth.service';
import * as firebase from 'firebase/app';
import 'firebase/firestore';
import CollectionReference = firebase.firestore.CollectionReference;

@Injectable({
  providedIn: 'root'
})
export class BusinessService {

  readonly customersCollection = firebase.firestore().collection('customers');
  readonly suppliersCollection = firebase.firestore().collection('suppliers');

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

  constructor(private authService: AuthService) {}

}
