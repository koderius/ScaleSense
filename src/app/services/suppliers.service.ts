import { Injectable } from '@angular/core';
import {BusinessDoc} from '../models/Business';
import {ProductDoc} from '../models/Product';
import {BusinessService} from './business.service';
import CollectionReference = firebase.firestore.CollectionReference;
import * as firebase from 'firebase';
import 'firebase/firestore';
import DocumentSnapshot = firebase.firestore.DocumentSnapshot;
import {FilesService} from './files.service';

@Injectable({
  providedIn: 'root'
})
export class SuppliersService {

  /** List of all the suppliers that belong to the current customer. Continually updated from the server */
  private _mySuppliers: BusinessDoc[] = [];


  constructor(
    private businessService: BusinessService,
    private filesService: FilesService,
  ) {

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

  get suppliersMetadata() {
    return this.businessService.businessDocRef.collection('metadata').doc('suppliers');
  }

  /** The reference to the firestore collection where the list of suppliers is stored */
  get mySuppliersRef() : CollectionReference {
    return this.businessService.businessDocRef.collection('mysuppliers');
  }


  /** Get the list of all the suppliers */
  get mySuppliers() {
    return this._mySuppliers.slice();
  }


  /** Load supplier by ID once (in case subscription has not started yet) */
  async loadSupplier(id: string) : Promise<BusinessDoc> {
    return (await this.mySuppliersRef.doc(id).get()).data();
  }


  /** Get supplier from the list by his ID */
  getSupplierById(id: string) : BusinessDoc | null {
    return {...this._mySuppliers.find((s)=>s.id == id)};
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

  // Delete the supplier, and reduce the number of supplier in the metadata
  async deleteSupplier(id: string) {
    try {
      return await firebase.firestore().runTransaction(async (transaction)=>{
        transaction.set(this.suppliersMetadata, {numOfSuppliers: firebase.firestore.FieldValue.increment(-1)}, {merge: true});
        transaction.delete(this.mySuppliersRef.doc(id));
      });
    }
    catch (e) {
      console.error(e);
    }
  }

  async saveSupplierDoc(supplierDoc: BusinessDoc, fileToUpload?: File, deleteLogo?: boolean) {

    // If new, create ID and stamp creation time
    if(!supplierDoc.id) {
      supplierDoc.id = this.mySuppliersRef.doc().id;
      supplierDoc.created = Date.now();
    }


    // Upload or delete logo image
    try {

      // If logo should be deleted, delete it from the server, and delete the supplier's logo field
      if(deleteLogo) {
        this.filesService.deleteFile(supplierDoc.id);
        delete supplierDoc.logo;
      }

      // If there is a file to upload
      if(fileToUpload)
        supplierDoc.logo = await this.filesService.uploadFile(fileToUpload, supplierDoc.id);

    }
    catch (e) {
      console.error(e);
    }

    // Save the supplier with an updated serial number
    try {
      await firebase.firestore().runTransaction(async transaction =>{
        // TODO: Make rules
        const serial = (await transaction.get(this.suppliersMetadata)).get('numOfSuppliers') || 0;
        supplierDoc.nid = serial + 1;

        supplierDoc.modified = Date.now();
        await transaction.set(this.mySuppliersRef.doc(supplierDoc.id), supplierDoc, {merge: true});

        transaction.set(this.suppliersMetadata, {numOfSuppliers: firebase.firestore.FieldValue.increment(1)}, {merge: true});

      });
    }
    catch (e) {
      console.error(e);
    }

  }

}
