import * as admin from 'firebase-admin';
import Transaction = admin.firestore.Transaction;
import DocumentSnapshot = admin.firestore.DocumentSnapshot;
import {HttpsError} from 'firebase-functions/lib/providers/https';
import {OrderChange, OrderDoc} from '../../src/app/models/OrderI';
import {ProductsListUtil} from '../../src/app/utilities/productsList';


/** The function reads the user's document (through a transaction) and checks whether the user has permission to change the given order */
export const checkUserPermission = async (transaction: Transaction, uid: string, orderSnapshot: DocumentSnapshot, requestedPermission?: string) : Promise<OrderChange> =>{

  // Read the user data, and his business belonging
  const userSnapshot = (await transaction.get(admin.firestore().collection('users').doc(uid)));
  const side = userSnapshot.get('side');
  const bid = userSnapshot.get('bid');
  const role = userSnapshot.get('role');
  const permissions = userSnapshot.get('permissions') as string[];

  if(role < 3 && !permissions.includes(requestedPermission || ''))
    throw new HttpsError('permission-denied','The user has no permission','The user has no permission to perform the requested operation');

  // Check whether the user's business ID is equal to the order CID or SID (if it's an existing order)
  if(orderSnapshot.exists && bid != orderSnapshot.get(side + 'id'))
    throw new HttpsError('permission-denied','The user is not linked to this order','The user is not under the supplier or the customer account of this order');

  // Return a change report basic data
  return {
    by: uid + '@' + bid,    // Pass also the BID and remove it later
    side: side,
    time: admin.firestore.Timestamp.now().toMillis(),
  };

};


/** This function saves changes into the order's document, after getting the change report, and send a notification to the other business */
export const saveOrderChanges = async (transaction: Transaction, orderSnapshot: DocumentSnapshot, orderDoc: OrderDoc, changeReport: OrderChange) => {

  let newData: OrderDoc;

  // Set data changes
  if (orderSnapshot.exists) {

    newData = {
      products: orderDoc.products || [],
      supplyTime: orderDoc.supplyTime || 0,
      comment: orderDoc.comment || '',
    };

    // Supplier can change also these fields
    if(changeReport.side == 's') {
      newData.boxes = orderDoc.boxes || 0;
      newData.invoice = orderDoc.invoice || '';
    }

    newData.status = orderDoc.status || NaN;

    const currentStatus = orderSnapshot.get('status') || NaN;

    // If some changes were made
    if(newData.comment != orderSnapshot.get('comment') || newData.supplyTime != orderSnapshot.get('supplyTime') || ProductsListUtil.CompareLists(orderSnapshot.get('products'), newData.products).length) {

      // Set to approved with changes / final approved with changes
      if(changeReport.side == 's') {
        newData.status++;
      }
      // Change by customer after opened by the supplier or before
      else {
        newData.status = currentStatus < 20 ? 11 : 21;
      }

    }
    // If no changes and same status
    else
      if(newData.status == currentStatus) {
        throw new HttpsError('permission-denied','No changes has been made');
      }

  }
  // For new orders, take all properties
  else {
    newData = orderDoc;
  }

  const changes = {
    products: newData.products,
    comment: newData.comment,
    supplyTime: newData.supplyTime,
  };

  // Update the change report
  changeReport.by = changeReport.by.split('@')[0];   // Remove the BID from the 'by' property, so it will contain the user ID only
  changeReport.status = newData.status;                       // Update the new status in the report
  changeReport.data = JSON.stringify(changes);                // Save changes snapshot

  // Update the order with the new data (or create a new order), set modification time and add the report object to the list
  await transaction.set(orderSnapshot.ref, {
    ...newData,
    modified: changeReport.time,
    changes: admin.firestore.FieldValue.arrayUnion(changeReport),
  }, {merge: true});

  // If the changes made by the customer before the supplier opened the order, don't sent him another notification
  if(newData.status == 11)
    return changeReport;

  // If the changes were made by the customer, send a notification to the supplier, and v.v.
  const sendToCollection = changeReport.side == 'c' ? 'suppliers' : 'customers';
  const bid = changeReport.side == 'c' ? 'sid' : 'cid';
  const sendToId = orderSnapshot.get(bid) || orderDoc[bid] as string;

  // Send notification with the report + order ID
  const notificationsRef = admin.firestore().collection(sendToCollection).doc(sendToId).collection('my_notifications').doc();
  await transaction.create(notificationsRef, {
    ...changeReport,
    orderId: orderSnapshot.get('id') || orderDoc.id,
  });

  return changeReport;

};
