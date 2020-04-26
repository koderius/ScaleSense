import { Injectable } from '@angular/core';
import {BusinessDoc} from '../models/Business';
import {ProductDoc} from '../models/Product';
import {BusinessService} from './business.service';
import CollectionReference = firebase.firestore.CollectionReference;
import * as firebase from 'firebase';
import 'firebase/firestore';
import DocumentSnapshot = firebase.firestore.DocumentSnapshot;

@Injectable({
  providedIn: 'root'
})
export class SuppliersService {

  /** List of all the suppliers that belong to the current customer. Continually updated from the server */
  private _mySuppliers: BusinessDoc[] = [];


  constructor(private businessService: BusinessService) {

    // Get all the suppliers of the current customer (sorted by name)
    try {
      this.mySuppliersRef.orderBy('name').onSnapshot(snapshot => {
        this._mySuppliers = snapshot.docs.map((d)=>d.data() as BusinessDoc);
      })
    }
    catch (e) {
      console.error(e);
    }

  }


  /** The reference to the firestore collection where the list of suppliers is stored */
  get mySuppliersRef() : CollectionReference {
    return this.businessService.businessDocRef.collection('mysuppliers');
  }


  /** Get the list of all the suppliers */
  get mySuppliers() {
    return this._mySuppliers.slice();
  }


  /** Get supplier from the list by his ID */
  getSupplierById(id: string) : BusinessDoc | null {
    return this._mySuppliers.find((s)=>s.id == id);
  }


  getSupplierByName(q: string) {
    q = q.toLowerCase();
    return this._mySuppliers.filter((s)=>s.name.toLowerCase().startsWith(q));
  }


  /** Query suppliers by their name, or by their products name/category */
  async querySuppliers(q: string) : Promise<BusinessDoc[]> {

    q = q.toLowerCase();

    // First, add the suppliers by their name to the results
    const results = this.getSupplierByName(q);

    if(q.length >= 3) {

      const queryResults = [];

      // Query products by name and category
      try {
        const p1 = this.mySuppliersRef.parent.collection('myproducts').where('name','>=',q).get().then((res)=>{queryResults.push(...res.docs)});
        const p2 = this.mySuppliersRef.parent.collection('myproducts').where('category','>=',q).get().then((res)=>{queryResults.push(...res.docs)});
        await Promise.all([p1,p2]);
      }
      catch (e) {
        console.error(e);
      }

      // After querying done, add the suppliers ID to the results
      queryResults.forEach((doc: DocumentSnapshot)=>{
        const sid = (doc.data() as ProductDoc).sid;
        if(!results.some((s)=>s.id == sid))
          results.push(this.getSupplierById(sid));
      });

    }

    return results;

  }

  async deleteSupplier(id: string) {
    try {
      await this.mySuppliersRef.doc(id).delete();
    }
    catch (e) {
      console.error(e);
    }
  }

}
