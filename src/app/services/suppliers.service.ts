import {Injectable} from '@angular/core';
import {SupplierDoc, SupplierStatus} from '../models/Business';
import {ProductCustomerDoc} from '../models/ProductI';
import {BusinessService} from './business.service';
import * as firebase from 'firebase/app';
import 'firebase/firestore';
import 'firebase/functions';
import {FilesService} from './files.service';
import {ProductsService} from './products.service';
import {Dictionary} from '../utilities/dictionary';
import CollectionReference = firebase.firestore.CollectionReference;
import DocumentSnapshot = firebase.firestore.DocumentSnapshot;

@Injectable({
  providedIn: 'root'
})
/**
 *  Suppliers service - For use of customers only
 *  In charge of loading the customer's list of suppliers and keep subscribing them for changes.
 *  Includes suppliers management (CRUD) and querying
 * */
export class SuppliersService {

  /** The collection of all the suppliers */
  public readonly allSuppliersRef = firebase.firestore().collection('suppliers');
  /** The collection of all the suppliers that was not created yet, but got an invitation */
  public readonly newSuppliersRef = firebase.firestore().collection('suppliers_new');

  /** List of all the suppliers that belong to the current customer. Continually updated from the server */
  private _mySuppliers: SupplierDoc[] = [];

  constructor(
    private businessService: BusinessService,
    private filesService: FilesService,
    private productsService: ProductsService,
  ) {

    // For customers only
    if(this.businessService.side != 'c')
      return;

    // Get all the suppliers of the current customer (sorted by name)
    try {
      this.mySuppliersRef.orderBy('name').onSnapshot(snapshot => {
        this._mySuppliers = snapshot.docs.map((d)=>d.data() as SupplierDoc);
      })
    }
    catch (e) {
      console.error(e);
    }

  }

  /** The reference to the firestore collection where the list of suppliers is stored */
  get mySuppliersRef() : CollectionReference {
    return this.businessService.businessDocRef.collection('my_suppliers');
  }


  /** Get the list of all the suppliers */
  get mySuppliers() {
    return this._mySuppliers.slice();
  }


  /** Load supplier by ID once (in case subscription has not started yet) */
  async loadSupplier(id: string) : Promise<SupplierDoc> {
    return (await this.mySuppliersRef.doc(id).get()).data();
  }


  /** Get supplier from the list by his ID */
  getSupplierById(id: string) : SupplierDoc | null {
    return this.mySuppliers.find((s)=>s.id == id);
  }


  getSupplierByName(q: string) {
    q = q.toLowerCase();
    return this.mySuppliers.filter((s)=>s.name.toLowerCase().startsWith(q));
  }


  /** Query suppliers by their name, or by their products name/category */
  async querySuppliers(q: string) : Promise<SupplierDoc[]> {

    q = q.toLowerCase();

    // First, add the suppliers by their name to the results
    const results = this.getSupplierByName(q);

    if(q.length) {

      const queryResults = [];

      // Query products by name and category, and collect the results of both queries
      try {
        const p1 = this.productsService.customerProductsRef
          .where('name','>=',q)
          .where('name','<',Dictionary.NextLastLetter(q)).get().then((res)=>{
          queryResults.push(...res.docs);
        });
        const p2 = this.productsService.customerProductsRef
          .where('category','>=',q)
          .where('category','<',Dictionary.NextLastLetter(q)).get().then((res)=>{
          queryResults.push(...res.docs)
        });
        await Promise.all([p1,p2]);
      }
      catch (e) {
        console.error(e);
      }

      // After querying done, add the suppliers ID to the results
      queryResults.forEach((doc: DocumentSnapshot)=>{
        const sid = (doc.data() as ProductCustomerDoc).sid;
        if(!results.some((s)=>s.id == sid))
          results.push(this.getSupplierById(sid));
      });

    }

    return results;

  }

  /** Delete the supplier */
  async deleteSupplier(id: string) {
    try {
      this.filesService.deleteFile(id);
      await this.mySuppliersRef.doc(id).delete();
    }
    catch (e) {
      console.error(e);
    }
  }


  /** Upload supplier data, and upload its logo */
  async saveSupplierDoc(supplierDoc: SupplierDoc, logoFile?: File) {

    // If NID supplied, and it belong to an existing supplier, edit this supplier
    if(supplierDoc.nid) {
       const supplier = this.mySuppliers.find((s)=>s.nid == supplierDoc.nid);
       if(supplier)
         supplierDoc.id = supplier.id;
    }
    // Or find available serial number (NID)
    else {
      let serial = 1;
      while (this.mySuppliers.some((s)=>s.nid == serial))
        serial++;
      supplierDoc.nid = serial;
    }

    // Set modification time
    supplierDoc.modified = Date.now();

    // For set creation time & new ID if needed
    if(!supplierDoc.id)
      supplierDoc.id = this.mySuppliersRef.doc().id;
    if(!supplierDoc.created)
      supplierDoc.created = supplierDoc.modified;

    // Upload or delete logo image
    try {
      // If there is no logo, delete the file (if exists)
      if(!supplierDoc.logo)
        this.filesService.deleteFile(supplierDoc.id);
      // Upload the temp file (if there is) and get its URL
      if(logoFile)
        supplierDoc.logo = await this.filesService.uploadFile(logoFile, supplierDoc.id);
    }
    catch (e) {
      console.error(e);
    }

    // Save the supplier
    try {
      await this.mySuppliersRef.doc(supplierDoc.id).set(supplierDoc, {merge: true});
      return true;
    }
    catch (e) {
      console.error(e);
    }

  }


  async sendSupplierInvitation(supplier: SupplierDoc, email: string) {
    if(supplier.status != SupplierStatus.INVITATION_WILL_BE_SENT)
      return;
    try {
      const sendSupplierInvitation = firebase.functions().httpsCallable('sendSupplierInvitation');
      await sendSupplierInvitation({supplierDoc: supplier, email: email});
      await this.mySuppliersRef.doc(supplier.id).update({status: SupplierStatus.INVITATION_SENT});
    }
    catch (e) {
      console.error(e);
    }
  }


  /** Get suppliers by common company ID */
  async searchSuppliersByCompanyId(supplier: SupplierDoc) : Promise<SupplierDoc[]> {
    const res = await this.allSuppliersRef.where('companyId', '==', supplier.companyId).get();
    return res.docs.map((d)=>d.data() as SupplierDoc);
  }


  /** Change supplier's ID, when linked to supplier from the main suppliers list */
  async changeMySupplierId(supplier: SupplierDoc, newId: string) {
    try {
      await firebase.firestore().runTransaction(async transaction => {
        const currentData = await transaction.get(this.mySuppliersRef.doc(supplier.id));
        transaction.set(this.mySuppliersRef.doc(newId), {...currentData, id: newId});
        transaction.delete(this.mySuppliersRef.doc(supplier.id));
      });
      supplier.id = newId;
    }
    catch (e) {
      console.error(e);
    }
  }


  /** Increase the search counter of this supplier by 1 */
  increaseSupplierSearch(sid: string) {
    this.mySuppliersRef.doc(sid).update({numOfOrders: firebase.firestore.FieldValue.increment(1)});
  }

}
