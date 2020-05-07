import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import {OrderChange, OrderDoc} from '../../src/app/models/OrderI';
import {HttpsError} from 'firebase-functions/lib/providers/https';
import {checkUserPermission, saveOrderChanges} from './inner_functions';

admin.initializeApp();

//
// /**
//  * The function get the customer basic data and create a user.
//  * The user email is unverified (until he resets his password) and disabled (until payment is being committed)
//  * It also creates a basic document for this customer's account and makes the user as the admin of this account.
//  * After this function returns, an email with reset password link should be sent to the user, in order to change his password and verify his
//  * email.
//  */
// export const registerCustomerFirstStep = functions.https.onCall(async (data) => {
//
//   // Create the main user with his details + random password
//   const user = await admin.auth().createUser({
//     displayName: data.fullname,
//     email: data.email,
//     phoneNumber: data.phone,
//     emailVerified: false,
//     disabled: true,
//   });
//
//   // Create customer document, and make this user as the admin (main manager)
//   await admin.firestore().collection('customers').add({
//     name: data.name,
//     admin: user.uid,
//   });
//
// });
//
//
// /** Check payment and enable / disable user */
// export const checkPayment = functions.https.onCall((data, context) => {});
//
//
//
//
// export const offerSpecialPrice = functions.https.onCall((data: {productId: string, customerId: string, price: number}, context) => {
//
//   if(data && context && context.auth) {
//
//     admin.firestore().runTransaction(async transaction => {
//
//       const uid = context.auth ? context.auth.uid : '';
//
//       // Get the supplier ID according to the user who called the function
//       const sid = (await transaction.get(admin.firestore().collection('users').doc(uid))).get('bid');
//
//       // Get the private customer data for the requested product
//       const customerProductRef = admin.firestore().collection('customers').doc(data.customerId).collection('my_products').doc(data.productId);
//       const productSid = (await transaction.get(customerProductRef)).get('sid');
//
//       // Check the user is the supplier who owned this product
//       if(productSid != sid)
//         throw new HttpsError('permission-denied', 'The supplier does not own this product');
//
//       // Set a special price in the customer private data of this product
//       transaction.update(customerProductRef, {price: data.price});
//
//     });
//
//   }
//
// });



export const updateOrder = functions.https.onCall(async (order: OrderDoc, context) => {

  if(order && context && context.auth) {

    return admin.firestore().runTransaction<OrderChange>(async transaction => {

      // Read the order
      const orderSnapshot = await transaction.get(admin.firestore().collection('orders').doc(order.id || ''));

      // Check whether the order is new
      const isNew = !orderSnapshot.exists;

      // Get the current status of the order
      const currentStatus = orderSnapshot.get('status');

      // If the order exists and is after final approval (or after cancellation), it cannot be changed
      if(!isNew && currentStatus >= 80)
        throw new HttpsError('permission-denied','The order cannot be changed anymore','The order is either closed or canceled');

      // TODO The permission the user need to create or update the order
      const permission = isNew ? 'canCreateOrder' : 'canEditOrder';

      // Check user permission (and get his data)
      const changeReport = await checkUserPermission(transaction, context.auth ? context.auth.uid : '', orderSnapshot, permission);

      // Suppliers can change order only after it was opened
      if(changeReport.side != 'c' && currentStatus < 20)
        throw new HttpsError('permission-denied','Suppliers can change order only after it was opened');

      if(isNew) {
        // Change status to 'SENT' and set creation time
        order.status = 10;
        order.created = changeReport.time;
        // Stamp the customer ID who created the order
        order.cid = changeReport.by.split('@')[1];
        // Create a document for this customers in the supplier's customers list
        transaction.set(admin.firestore().collection('suppliers').doc(order.sid || '').collection('my_customers').doc(order.cid), {id: order.cid}, {merge: true});
      }

      // Supplier can sent order only with APPROVED (30) or FINAL_APPROVED (80)
      if(changeReport.side == 's' && order.status != 30 && order.status != 80)
        throw new HttpsError('permission-denied','Supplier can sent order only with APPROVED (30) or FINAL_APPROVED (80)');

      // Save the changes and return the changes report to the user
      return await saveOrderChanges(transaction, orderSnapshot, order, changeReport);

    });

  }

  return null;

});


export const changeOrderStatus = functions.https.onCall(async (order: OrderDoc, context) => {

  if(order && context && context.auth) {

    return admin.firestore().runTransaction<OrderChange>(async transaction => {

      // Read the order
      const orderSnapshot = await transaction.get(admin.firestore().collection('orders').doc(order.id || ''));

      const currentStatus = orderSnapshot.get('status');

      // Check user permission (and get his data) //TODO: add requested permission name
      const changeReport = await checkUserPermission(transaction, context.auth ? context.auth.uid : '', orderSnapshot);

      if(order.status == 20) {
        if(currentStatus >= 20)
          throw new HttpsError('permission-denied','Order is already opened');
        if(changeReport.side != 's')
          throw new HttpsError('permission-denied','Order can be opened only by supplier');
      }

      if(order.status == 400) {
        if(currentStatus >= 80)
          throw new HttpsError('permission-denied','Order cannot be cancelled after it was finally approved');
        // Check which side cancelled
        order.status += changeReport.side == 'c' ? 1 : 2;
      }

      if(order.status == 100) {
        if(currentStatus < 80)
          throw new HttpsError('permission-denied','Order has not been finally approved yet');
        if(currentStatus >= 100)
          throw new HttpsError('permission-denied','Order is already closed/cancelled');
      }

      // Save the changes and return the changes report to the user
      return await saveOrderChanges(transaction, orderSnapshot, order, changeReport);

    })

  }

  return null;

});
