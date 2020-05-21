import {Injectable} from '@angular/core';
import {ReturnDoc} from '../models/Return';
import * as firebase from 'firebase/app';
import 'firebase/firestore';
import {BusinessService} from './business.service';
import {OrdersService} from './orders.service';
import {ProductsService} from './products.service';
import {Dictionary} from '../utilities/dictionary';
import {Objects} from '../utilities/objects';

@Injectable({
  providedIn: 'root'
})
export class ReturnService {

  readonly returnsCollectionRef = firebase.firestore().collection('returns');
  readonly returnsDraftsCollectionRef = this.businessService.businessDocRef.collection('my_drafts_returns');

  /** Temporary list of drafts, for sending as a batch */
  returnsDocsList: ReturnDoc[] = [];

  /** Keep driver name for documents in the same list */
  tempDriverName: string;

  constructor(
    private businessService: BusinessService,
    private orderService: OrdersService,
    private productsService: ProductsService,
  ) { }


  // loadReturnsOfBusiness(bid: string) {
  //
  //   // Get Supplier and customer IDs
  //   const cid = this.businessService.side == 'c' ? this.businessService.myBid : bid;
  //   const sid = this.businessService.side == 's' ? this.businessService.myBid : bid;
  //
  //   this.returnsCollectionRef.where('cid', '==', cid).where('sid', '==', sid)
  //
  // }


  /** Get a document draft according to ID (which contains the order's and the product's IDs) */
  async loadDraft(id: string) : Promise<ReturnDoc> {
    try {
      return (await this.returnsDraftsCollectionRef.doc(id).get()).data() as ReturnDoc;
    }
    catch (e) {
      console.error(e);
    }
  }


  /** Query drafts documents by order (serial, invoice), product's name or supplier ID */
  async queryDrafts(sid?: string, q?: string) {


    let ref = q ? this.returnsDraftsCollectionRef.orderBy('productName') : this.returnsDraftsCollectionRef;

    // Filter by SID, or order by SID
    if(sid)
      ref = ref.where('sid', '==', sid);
    else
      ref = ref.orderBy('sid');

    if(q) {

      // If the query starts with a number (order's serial or invoice), get order ID
      const order = !isNaN(+q[0]) ? (await this.orderService.queryOrders(false, q))[0] : null;
      if(order)
        ref = ref.where('orderId', '==', order.id);
      else
        // Get products ID that their names correspond to the query
        ref = ref
          .where('productName', '>=', q).where('productName', '<', Dictionary.NextLastLetter(q))
          .orderBy('orderId');

    }

    try {
      const res = await ref.get();
      return res.docs.map((d)=>d.data() as ReturnDoc);
    }
    catch (e) {
      console.error(e);
    }

  }


  /** Add document to the list and save it as a draft */
  addDoc(doc: ReturnDoc, noSave?: boolean) {

    // Save draft
    if(!noSave)
      this.saveDraft(doc);

    // If not belong to the same supplier, start a new list for this supplier
    if(this.returnsDocsList.length && doc.sid != this.returnsDocsList[0].sid)
      this.clearList();

    // Add to list (if not already there)
    if(!this.isInList(doc.id))
      this.returnsDocsList.push(doc);

    // Keep driver name for next pushes
    this.tempDriverName = doc.driverName;

  }


  /** Save new draft, or draft's changes */
  async saveDraft(doc: ReturnDoc) {
    // Generate ID (for new documents)
    ReturnService.ReturnID(doc);
    // Clear undefined fields
    Objects.ClearFalsy(doc);
    // Save
    try {
      await this.returnsDraftsCollectionRef.doc(doc.id).set(doc, {merge: true});
    }
    catch (e) {
      console.error(e);
    }
  }


  /** Clear the temporary list */
  clearList() {
    this.returnsDocsList.splice(0);
    this.tempDriverName = '';
  }


  /** Whether a document is already in the list */
  isInList(id: string) {
    return this.returnsDocsList.some((r)=>r.id == id);
  }


  /** Send the list to the supplier */
  async sendListToSupplier() {

    const batch = firebase.firestore().batch();

    // For each draft in the list to send
    this.returnsDocsList.forEach((draft)=>{

      // Save in the draft in the returns collection (stamp with customer ID and time)
      batch.set(this.returnsCollectionRef.doc(draft.id), {
        ...draft,
        cid: this.businessService.myBid,
        time: Date.now(),
      });

      // Delete the draft
      batch.delete(this.returnsDraftsCollectionRef.doc(draft.id))

    });

    try {
      // Commit
      await batch.commit();
      // When done, clear the list
      this.clearList();
      // TODO: Print report...
    }
    catch (e) {
      console.error(e);
    }

  }

  removeFromList(id: string) {
    const idx = this.returnsDocsList.findIndex((d)=>d.id == id);
    this.returnsDocsList.splice(idx,1);
  }

  async deleteDraft(id: string) {
    await this.returnsDraftsCollectionRef.doc(id).delete();
    this.removeFromList(id);
  }


  /** Set the ID of a given document to contain both order's and product's IDs */
  static ReturnID(returnDoc: ReturnDoc) : string {
    returnDoc.id = returnDoc.orderId + '_' + returnDoc.product.id;
    return returnDoc.id;
  }

}
