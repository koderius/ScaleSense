import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import {OrderChange, OrderDoc} from '../../src/app/models/OrderI';
import {HttpsError} from 'firebase-functions/lib/providers/https';

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



// export const orderUpdate = functions.https.onCall(async (order: OrderDoc, context) => {
//
//   return await admin.firestore().runTransaction<OrderChange>(async (transaction)=>{
//
//     // Get the user data, and his business belonging
//     const uid = context.auth ? context.auth.uid : '';
//     const userData = (await transaction.get(admin.firestore().collection('users').doc(uid))).data();
//     const side = userData ? userData.side : '';
//     const bid = userData ? userData.bid : '';
//
//     // TODO: Check permissions of this user
//
//     // New document that contains all the fields that are allowed to be change
//     let updatedOrder: OrderDoc = {
//       products: order.products,
//       supplyTime: order.supplyTime,
//       comment: order.comment || '',
//       invoice: order.invoice || '',
//     };
//
//     // Save those fields as JSON for the changes list
//     const changesData = JSON.stringify(updatedOrder);
//
//     const timestamp = admin.firestore.Timestamp.now().toMillis();
//
//     // For draft being sent for the first time, all fields are allowed to be set
//     if(order.status === 0) {
//
//       // Create draft new ID: (1) might not have ID if hasn't saved before (2) Security: prevent sending an order as draft more than once
//       order.id = admin.firestore().collection('orders').doc().id;
//
//       // Take all fields
//       updatedOrder = order;
//
//       updatedOrder.created = timestamp;                 // Update the creation time to be the time of sending (instead of time of creating the draft)
//       updatedOrder.cid = bid;                           // Update the customer ID (according to the user who commit the function's call)
//       updatedOrder.status = 10;                         // Change the status from 'DRAFT' (0) to 'SENT' (10)
//
//     }
//
//     // For opened order, set the status as changed by customer or by supplier
//     else
//       updatedOrder.status = 20 + (side == 's' ? 1 : 2);
//
//     // Set time of modification
//     updatedOrder.modified = timestamp;
//
//     // Create a changes report object (who and when)
//     const changes: OrderChange = {
//       by: uid,
//       side: side,
//       time: timestamp,
//       status: updatedOrder.status,
//       data: changesData,
//     };
//
//     // Save all fields, add the current changes to the versions list
//     const orderRef = admin.firestore().collection('orders').doc(order.id || '');
//     await transaction.set(orderRef, {
//       ...updatedOrder,
//       changes: admin.firestore.FieldValue.arrayUnion(changes)
//     },
//       {merge: true});
//
//     // If the changes were made by the customer, add a notification to the supplier, and v.v.
//     const ref = side == 'c'
//       ? admin.firestore().collection('suppliers').doc(order.sid || '').collection('my_notifications')
//       : admin.firestore().collection('customers').doc(order.cid || '').collection('my_notifications');
//
//     // Send notification with change data + order ID
//     await transaction.create(ref.doc(), {
//       ...changes,
//       orderId: order.id,
//     });
//
//     return changes;
//
//   });
//
// });
//
//
// /**
//  * Cancel an order according to the given ID.
//  * Order can be cancel by both customer or supplier.
//  * The function check that the user is under the business that the order belongs to, and that the user has permission to cancel orders
//  */
// export const cancelOrder = functions.https.onCall(async (orderId, context) => {
//
//   return await admin.firestore().runTransaction<OrderChange | null>(async transaction => {
//
//     const orderRef = admin.firestore().collection('orders').doc(orderId);
//
//     // Cannot cancel an order that is already canceled or closed
//     if((await transaction.get(orderRef)).get('status') > 40)
//       return null;
//
//     // Get the user data, and his business belonging
//     const uid = context.auth ? context.auth.uid : '';
//     const userData = (await transaction.get(admin.firestore().collection('users').doc(uid))).data();
//     const side = userData ? userData.side : '';
//     const bid = userData ? userData.bid : '';
//
//     // TODO: Check permissions of this user
//
//     const cid = (await transaction.get(orderRef)).get('cid');
//     const sid = (await transaction.get(orderRef)).get('sid');
//
//     // Check order is connected to the business of the user
//     if((side == 'c' ? cid : sid) == bid) {
//
//       // Create a changes report object
//       const changes: OrderChange = {
//         by: uid,
//         side: side,
//         time: admin.firestore.Timestamp.now().toMillis(),
//         status: 40 + (side == 's' ? 1 : 2),
//       };
//
//       // Set the order with the new status, and add the change report
//       transaction.update(orderRef,{
//         status: changes.status,
//         changes: admin.firestore.FieldValue.arrayUnion(changes),
//       });
//
//       // If the changes were made by the customer, add a notification to the supplier, and v.v.
//       const ref = side == 'c'
//         ? admin.firestore().collection('suppliers').doc(sid || '').collection('my_notifications')
//         : admin.firestore().collection('customers').doc(cid || '').collection('my_notifications');
//
//       // Send notification with change data + order ID
//       await transaction.create(ref.doc(), {
//         ...changes,
//         orderId: orderId,
//       });
//
//       return changes;
//
//     }
//
//     return null;
//
//   })
//
// });

export const updateOrder = functions.https.onCall(async (order: OrderDoc, context) => {

  return await admin.firestore().runTransaction(async transaction =>{

    if(order && context && context.auth) {

      // Order reference and snapshot
      const orderRef = admin.firestore().collection('orders').doc(order.id || '');
      const orderSnapshot = await transaction.get(orderRef);

      let action;

      // If the order does not exist, it's a new order
      if(!orderSnapshot.exists)
        action = 'create';

      // If it exist, check its current status
      else {

        const status = orderSnapshot.get('status');

        // The order cannot be change anymore
        if(status > 40)
          throw new HttpsError('permission-denied','The order cannot be changed anymore','The order is either closed or canceled');

        // Check what is the required action
        switch (order.status) {
          case 11: action = 'open'; break;
          case 12: action = 'approve'; break;
          case 41: case 42: action = 'cancel'; break;
          case 100: action = 'close'; break;
          default: action = 'edit';
        }

      }

      // Get the user data, and his business belonging
      const uid = context.auth ? context.auth.uid : '';
      const userData = (await transaction.get(admin.firestore().collection('users').doc(uid))).data();
      const side = userData ? userData.side : '';
      const bid = userData ? userData.bid : '';
      // TODO: Check also permissions of this user and whether he is allowed to perform the requested action

      // Check the operation is being made by the right side
      if(action =='create' && side == 's')
        throw new HttpsError('permission-denied','Operation cannot be done by supplier', 'Only the customer can create an order');
      if((action == 'open' || action == 'approve') && side == 'c')
        throw new HttpsError('permission-denied','Operation cannot be done by customer', 'Only the supplier can open or approve the order');
      // TODO: Who can close the order?

      // Get the customer ID and the supplier ID
      const cid = orderSnapshot.get('cid') || bid;
      const sid = orderSnapshot.get('sid');

      // Check that the user ID is under the customer/supplier
      if((side == 'c' ? cid : sid) != bid)
        throw new HttpsError('permission-denied','The user is not linked to this order','The user is not under the supplier or the customer account of this order');

      // Create a changes report object
      const report: OrderChange = {
        by: uid,
        side: side,
        time: admin.firestore.Timestamp.now().toMillis(),
      };

      // Create data object to update for updating the order
      let dataToSave: OrderDoc;

      // For creation or editing an order
      if(action == 'create' || action == 'edit') {

        // New document that contains all the fields that are allowed to be changed, and that will be add to the order history as JSON
        dataToSave = {
          products: order.products,
          supplyTime: order.supplyTime,
          comment: order.comment || '',
          invoice: order.invoice || '',
        };

        // Save those fields as JSON for the changes list
        report.data = JSON.stringify(dataToSave);

        // for creation: Get all the data that the user sent, and add some details
        if(action == 'create') {

          // Take all fields
          dataToSave = order;
          dataToSave.created = report.time;                                     // Update the creation time to be the time of sending (instead of time of creating the draft)
          dataToSave.cid = bid;                                                 // Update the customer ID (according to the user who commit the function's call)
          dataToSave.status = 10;                                               // Change the status from 'DRAFT' (0) to 'SENT' (10)

        }

        // For editing: Set the status to 'CHANGED BY SUPPLIER' (21) or 'CHANGED BY CUSTOMER' (22)
        else
          dataToSave.status = 20 + (side == 's' ? 1 : 2);

      }

      // For all other statuses: change only the status
      else {
        dataToSave = {status: order.status};
        if(action == 'cancel')
          dataToSave.status = 40 + (side == 's' ? 1 : 2);
      }

      // Update the new status in the report
      report.status = dataToSave.status || -1;

      // Update the order with the new data (or create a new order), set modification time and add the report object to the list
      await transaction.set(orderRef, {
        ...dataToSave,
        modified: report.time,
        changes: admin.firestore.FieldValue.arrayUnion(report),
      },
      {merge: true});

      // If the changes were made by the customer, add a notification to the supplier, and v.v.
      const sendTo = side == 'c' ? 'suppliers' : 'customers';

      // Send notification with the report + order ID
      await transaction.create(admin.firestore().collection(sendTo).doc(cid || '').collection('my_notifications').doc(), {
        ...report,
        orderId: order.id,
      });

      return report;

    }

    throw new HttpsError('invalid-argument', 'The functions call miss required data', 'Order data is missing, or unauthenticated user.');

  });

});
