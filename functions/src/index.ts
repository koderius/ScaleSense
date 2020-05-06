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
        // Create a document for this customers in the supplier's customers list
        transaction.set(admin.firestore().collection('suppliers').doc(order.sid || '').collection('my_customers').doc(order.cid), {id: order.cid}, {merge: true});
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
