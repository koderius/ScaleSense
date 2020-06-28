import {Injectable} from '@angular/core';
import {ReturnDoc, ReturnStatus} from '../models/Return';
import * as firebase from 'firebase/app';
import 'firebase/firestore';
import {BusinessService} from './business.service';
import {OrdersService} from './orders.service';
import {Dictionary} from '../utilities/dictionary';
import {Objects} from '../utilities/objects';
import {ReportsGeneratorService} from './reports-generator.service';

@Injectable({
  providedIn: 'root'
})
export class ReturnService {

  /** The reference for the returns collection */
  readonly returnsCollectionRef = firebase.firestore().collection('returns');
  /** The reference for the returns drafts collection (Only for customers) */
  readonly returnsDraftsCollectionRef = this.businessService.side == 'c' ? this.businessService.businessDocRef.collection('my_drafts_returns') : null;

  /** Temporary list of drafts, for sending as a batch */
  returnsDocsList: ReturnDoc[] = [];

  /** Keep driver name for documents in the same list */
  tempDriverName: string;

  constructor(
    private businessService: BusinessService,
    private orderService: OrdersService,
    private reportsService: ReportsGeneratorService,
  ) { }


  /** Load all the returns (For suppliers) */
  async loadAllMyReturns(lastDoc?: ReturnDoc, firstDoc?: ReturnDoc, refreshFromFirstDoc?: ReturnDoc) : Promise<ReturnDoc[]> {

    // Get all supplier's returns, ordered from new to old
    let ref = this.returnsCollectionRef
      .where('sid', '==', this.businessService.myBid)
      .where('status', '>', ReturnStatus.TRASH)
      .orderBy('status')
      .orderBy('time', 'desc')
      .orderBy('id');

    // Pagination
    if(refreshFromFirstDoc)
      ref = ref.startAt(refreshFromFirstDoc);
    if(lastDoc)
      ref = ref.startAfter(lastDoc.status, lastDoc.time, lastDoc.id);
    if(firstDoc)
      ref = ref.endBefore(firstDoc.status, firstDoc.time, firstDoc.id).limitToLast(10);
    else
      ref = ref.limit(10);

    try {
      const res = await ref.get();
      return res.docs.map((d)=>d.data() as ReturnDoc);
    }
    catch (e) {
      console.error(e);
      return [];
    }

  }


  /** Delete return (For suppliers) */
  async deleteReturn(returnId: string) {
    try {
      await this.returnsCollectionRef.doc(returnId).delete();
    }
    catch (e) {
      console.error(e);
    }
  }


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
      return [];
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
      this.sendReturnReport();
    }
    catch (e) {
      console.error(e);
    }

  }


  async sendReturnReport() {

    // For each product document, get its order and set the product in it
    const promises = this.returnsDocsList.map(async (doc)=>{
      const order = await this.orderService.getOrderById(doc.orderId, false);
      const orderDoc = order.getDocument();
      orderDoc.products = [doc.product];
      this.reportsService.results.push(orderDoc);
    });
    await Promise.all(promises);
    this.reportsService.createReportData(true);
    this.reportsService.createReportTables();
    this.reportsService.sendReportEmail(
      this.businessService.businessDoc.accountancyEmail || this.businessService.businessDoc.contacts[0].email,
      'return_report',
      'דו"ח החזרת סחורה',
      'מצ"ב דו"ח החזרת סחורה'
    )

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
