import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import {OrderChange, OrderDoc} from '../../src/app/models/OrderI';
import {HttpsError} from 'firebase-functions/lib/providers/https';
import {checkUserPermission, saveOrderChanges} from './inner_functions';

admin.initializeApp();


/**
 * The function get the customer basic data and create a user.
 * The user email is unverified (until he resets his password) and disabled (until payment is being committed)
 * It also creates a basic document for this customer's account and makes the user as the admin of this account.
 * After this function returns, an email with reset password link should be sent to the user, in order to change his password and verify his
 * email.
 */
export const registerCustomerFirstStep = functions.https.onCall(async (data) => {

  // Create the main user with his details + random password
  const user = await admin.auth().createUser({
    displayName: data.fullname,
    email: data.email,
    phoneNumber: data.phone,
    emailVerified: false,
    disabled: true,
  });

  // Create customer document, and make this user as the admin (main manager)
  await admin.firestore().collection('customers').add({
    name: data.name,
    admin: user.uid,
  });

});


/** Check payment and enable / disable user */
export const checkPayment = functions.https.onCall((data, context) => {});




export const offerSpecialPrice = functions.https.onCall((data: {productId: string, customerId: string, price: number}, context) => {

  if(data && context && context.auth) {

    admin.firestore().runTransaction(async transaction => {

      const uid = context.auth ? context.auth.uid : '';

      // Get the supplier ID according to the user who called the function
      const sid = (await transaction.get(admin.firestore().collection('users').doc(uid))).get('bid');

      // Get the private customer data for the requested product
      const customerProductRef = admin.firestore().collection('customers').doc(data.customerId).collection('my_products').doc(data.productId);
      const productSid = (await transaction.get(customerProductRef)).get('sid');

      // Check the user is the supplier who owned this product
      if(productSid != sid)
        throw new HttpsError('permission-denied', 'The supplier does not own this product');

      // Set a special price in the customer private data of this product
      transaction.update(customerProductRef, {price: data.price});

    });

  }

});


export const updateOrder = functions.https.onCall(async (order: OrderDoc, context) => {

  if(order && context && context.auth) {

    return await admin.firestore().runTransaction<OrderChange>(async transaction => {

      // Read the order
      const orderSnapshot = await transaction.get(admin.firestore().collection('orders').doc(order.id || ''));

      // Check whether it's a new order
      const isNew = !orderSnapshot.exists;

      //TODO: add requested permission name
      let permissionNeeded = isNew ? 'canCreate' : 'canEdit';
      switch (order.status) {
        case 11: permissionNeeded = ''; break;
        case 12: permissionNeeded = 'canApprove'; break;
        case 13: permissionNeeded = 'canFinalApprove'; break;
        case 100: permissionNeeded = 'canClose'; break;
        case 40: case 41: case 42: permissionNeeded = 'canCancel'; break;
      }

      // Check user permission (and get his data)
      const changeReport = await checkUserPermission(transaction, context.auth ? context.auth.uid : '', orderSnapshot, permissionNeeded);

      // Manipulate order details
      if(isNew) {
        // Change status to 'sent' and set creation time
        order.status = 10;
        order.created = changeReport.time;
        // Stamp the customer ID who created the order
        order.cid = changeReport.by.split('@')[1];
      }
      else {
        // Manage statuses
        switch (order.status) {
          // 'opened', 'approve' & 'on the way' can be set only by the supplier
          case 11: case 12: case 13:
            if(changeReport.side != 's')
              throw new HttpsError('permission-denied','This status can be changed only by the supplier');
            break;
          // 'close' can be set only by the customer
          case 100:
            if(changeReport.side != 'c')
              throw new HttpsError('permission-denied','Only the customer can close the order');
            break;
          // For 'cancel', define which side perform the cancellation
          case 40: case 41: case 42:
            order.status = 40 + (changeReport.side == 's' ? 1 : 2);
            break;
          // For all the rest, set whether the order was changed by the supplier or the customer
          default: order.status = 20 + (changeReport.side == 's' ? 1 : 2);
        }
      }

      // Save the changes and return the changes report to the user
      return await saveOrderChanges(transaction, orderSnapshot, order, changeReport);

    });

  }

  return null;

});

// export const updateOrder = functions.https.onCall(async (order: OrderDoc, context) => {
//
//   return await admin.firestore().runTransaction(async transaction =>{
//
//     if(order && context && context.auth) {
//
//       // Order reference and snapshot
//       const orderRef = admin.firestore().collection('orders').doc(order.id || '');
//       const orderSnapshot = await transaction.get(orderRef);
//
//       let action;
//
//       // If the order does not exist, it's a new order
//       if(!orderSnapshot.exists)
//         action = 'create';
//
//       // If it exist, check its current status
//       else {
//
//         const status = orderSnapshot.get('status');
//
//         // The order cannot be change anymore
//         if(status > 40)
//           throw new HttpsError('permission-denied','The order cannot be changed anymore','The order is either closed or canceled');
//
//         // Check what is the required action
//         switch (order.status) {
//           case 11: action = 'open'; break;
//           case 12: action = 'approve'; break;
//           case 41: case 42: action = 'cancel'; break;
//           case 100: action = 'close'; break;
//           default: action = 'edit';
//         }
//
//       }
//
//       // Get the user data, and his business belonging
//       const uid = context.auth ? context.auth.uid : '';
//       const userData = (await transaction.get(admin.firestore().collection('users').doc(uid))).data();
//       const side = userData ? userData.side : '';
//       const bid = userData ? userData.bid : '';
//       // TODO: Check also permissions of this user and whether he is allowed to perform the requested action
//
//       // Check the operation is being made by the right side
//       if(action =='create' && side == 's')
//         throw new HttpsError('permission-denied','Operation cannot be done by supplier', 'Only the customer can create an order');
//       if((action == 'open' || action == 'approve') && side == 'c')
//         throw new HttpsError('permission-denied','Operation cannot be done by customer', 'Only the supplier can open or approve the order');
//       // TODO: Who can close the order?
//
//       // Get the customer ID and the supplier ID
//       const cid = orderSnapshot.get('cid') || bid;
//       const sid = orderSnapshot.get('sid');
//
//       // Check that the user ID is under the customer/supplier
//       if((side == 'c' ? cid : sid) != bid)
//         throw new HttpsError('permission-denied','The user is not linked to this order','The user is not under the supplier or the customer account of this order');
//
//       // Create a changes report object
//       const report: OrderChange = {
//         by: uid,
//         side: side,
//         time: admin.firestore.Timestamp.now().toMillis(),
//       };
//
//       // Create data object to update for updating the order
//       let dataToSave: OrderDoc;
//
//       // For creation or editing an order
//       if(action == 'create' || action == 'edit') {
//
//         // New document that contains all the fields that are allowed to be changed, and that will be add to the order history as JSON
//         dataToSave = {
//           products: order.products,
//           supplyTime: order.supplyTime,
//           comment: order.comment || '',
//           invoice: order.invoice || '',
//         };
//
//         // Save those fields as JSON for the changes list
//         report.data = JSON.stringify(dataToSave);
//
//         // for creation: Get all the data that the user sent, and add some details
//         if(action == 'create') {
//
//           // Take all fields
//           dataToSave = order;
//           dataToSave.created = report.time;                                     // Update the creation time to be the time of sending (instead of time of creating the draft)
//           dataToSave.cid = bid;                                                 // Update the customer ID (according to the user who commit the function's call)
//           dataToSave.status = 10;                                               // Change the status from 'DRAFT' (0) to 'SENT' (10)
//
//         }
//
//         // For editing: Set the status to 'CHANGED BY SUPPLIER' (21) or 'CHANGED BY CUSTOMER' (22)
//         else
//           dataToSave.status = 20 + (side == 's' ? 1 : 2);
//
//       }
//
//       // For all other statuses: change only the status
//       else {
//         dataToSave = {status: order.status};
//         if(action == 'cancel')
//           dataToSave.status = 40 + (side == 's' ? 1 : 2);
//       }
//
//       // Update the new status in the report
//       report.status = dataToSave.status || -1;
//
//       // Update the order with the new data (or create a new order), set modification time and add the report object to the list
//       await transaction.set(orderRef, {
//         ...dataToSave,
//         modified: report.time,
//         changes: admin.firestore.FieldValue.arrayUnion(report),
//       },
//       {merge: true});
//
//       // If the changes were made by the customer, add a notification to the supplier, and v.v.
//       const sendTo = side == 'c' ? 'suppliers' : 'customers';
//
//       // Send notification with the report + order ID
//       await transaction.create(admin.firestore().collection(sendTo).doc(cid || '').collection('my_notifications').doc(), {
//         ...report,
//         orderId: order.id,
//       });
//
//       return report;
//
//     }
//
//     throw new HttpsError('invalid-argument', 'The functions call miss required data', 'Order data is missing, or unauthenticated user.');
//
//   });
//
// });
