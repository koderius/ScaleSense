import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import {OrderChange, OrderDoc} from '../../src/app/models/OrderI';

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



export const orderUpdate = functions.https.onCall(async (order: OrderDoc, context) => {

  return await admin.firestore().runTransaction(async (transaction)=>{

    // Get the user data, and his business belonging
    const uid = context.auth ? context.auth.uid : '';
    const userData = (await transaction.get(admin.firestore().collection('users').doc(uid))).data();
    const side = userData ? userData.side : '';
    const bid = userData ? userData.bid : '';

    // TODO: Check permissions of this user

    // New document that contains all the fields that are allowed to be change
    let updatedOrder: OrderDoc = {
      products: order.products,
      supplyTime: order.supplyTime,
      comment: order.comment || '',
      invoice: order.invoice || '',
    };

    // Save those fields as JSON for the changes list
    const changesData = JSON.stringify(updatedOrder);

    const timestamp = admin.firestore.Timestamp.now().toMillis();

    // For draft being sent for the first time, all fields are allowed to be set
    if(order.status === 0) {

      // Create draft new ID: (1) might not have ID if hasn't saved before (2) Security: prevent sending an order as draft more than once
      order.id = admin.firestore().collection('orders').doc().id;

      // Take all fields
      updatedOrder = order;

      updatedOrder.created = timestamp;                 // Update the creation time to be the time of sending (instead of time of creating the draft)
      updatedOrder.cid = bid;                           // Update the customer ID (according to the user who commit the function's call)
      updatedOrder.status = 10;                         // Change the status from 'DRAFT' (0) to 'SENT' (10)

    }

    // For opened order, set the status as changed by customer or by supplier
    else
      updatedOrder.status = 20 + (side == 's' ? 1 : 2);

    // Set time of modification
    updatedOrder.modified = timestamp;

    // Create a changes report object (who and when)
    const changes: OrderChange = {
      by: uid,
      side: side,
      time: timestamp,
      status: updatedOrder.status,
      data: changesData,
    };

    // Save all fields, add the current changes to the versions list
    const orderRef = admin.firestore().collection('orders').doc(order.id || '');
    await transaction.set(orderRef, {
      ...updatedOrder,
      changes: admin.firestore.FieldValue.arrayUnion(changes)
    },
      {merge: true});

    // If the changes were made by the customer, add a notification to the supplier, and v.v.
    const ref = side == 'c'
      ? admin.firestore().collection('suppliers').doc(order.sid || '').collection('my_notifications')
      : admin.firestore().collection('customers').doc(order.cid || '').collection('my_notifications');

    // Send notification with change data + order ID
    await transaction.create(ref.doc(), {
      ...changes,
      orderId: order.id,
    });

    return true;

  });

});


// /**
//  * Update order data.
//  * It compares the changes between the old and the new version of the order, adds them to the order's history (changes) list and sends a notification to the other side
//  * * If the order is a draft, it's status changed to 'sent' and it's added to the order list (no other changes are being compared)
//  * Notification with the changes being made is sent to the other side (customer or supplier)
//  */
// export const updateOrder = functions.https.onCall(async (newData: OrderDoc, context) => {
//
//   if(newData && newData.id && context && context.auth && context.auth.uid) {
//
//     return await admin.firestore().runTransaction<boolean>(async (transaction)=>{
//
//       // Get the user data, and his business belonging
//       const uid = context.auth ? context.auth.uid : '';
//       const userData = (await transaction.get(admin.firestore().collection('users').doc(uid))).data();
//       const side = userData ? userData.side : '';
//       const bid = userData ? userData.bid : '';
//
//       // TODO: Check permissions of this user
//
//       const orderRef = admin.firestore().collection('orders').doc(newData.id || '');
//
//       const timestamp = admin.firestore.Timestamp.now().toMillis();
//
//       // Create a changes report object (who and when)
//       const changes: OrderChange = {
//         by: uid,
//         side: side,
//         time: timestamp,
//       };
//
//       // For draft - change to status to sent
//       if(newData.status === 0) {
//         newData.cid = bid;
//         newData.status = 10;
//         changes.statusChange = {old: 0, new: 10};
//       }
//
//       // For opened order - check changes between old data and new data
//       else {
//
//         // Get old data of the order
//         const oldData = (await transaction.get(orderRef)).data() as OrderDoc;
//
//         // Check changes in general order details
//         if(oldData.status != newData.status)
//           changes.statusChange = {old: oldData.status || 0, new: newData.status || 0};
//         if(oldData.supplyTime != newData.supplyTime)
//           changes.supplyTimeChange = {old: oldData.supplyTime || NaN, new: newData.supplyTime || NaN};
//         if(oldData.comment != newData.comment)
//           changes.commentToSupplierChange = {old: oldData.comment || '', new: newData.comment || ''};
//
//         // Check changes in products list
//         changes.productsChanges = [];
//
//         // Get a list of all products IDs
//         const allProducts = new Set<string>();
//         [...(newData.products || []), ...(oldData.products || [])].forEach((p)=>{allProducts.add(p.id)});
//
//         // Check differences between each product
//         allProducts.forEach((id)=>{
//
//           const oldProduct = (oldData.products || []).find((p)=>p.id == id);
//           const newProduct = (newData.products || []).find((p)=>p.id == id);
//
//           // If there are differences, add the old version and the new version
//           if(!newProduct || !oldProduct || newProduct.amount != oldProduct.amount || newProduct.pricePerUnit != oldProduct.pricePerUnit || newProduct.comment != oldProduct.comment)
//             (changes.productsChanges || []).push({old: oldProduct || null, new: newProduct || null});
//
//         });
//
//         // Update the price if there are changes in the products list
//         if(changes.productsChanges && changes.productsChanges.length) {
//           const calcPrice = (products: ProductOrder[])=>{
//             let sum = 0;
//             products.forEach((po)=>{
//               sum += ((po.pricePerUnit || 0) * (po.amount || 0));
//             });
//             return sum;
//           };
//           changes.priceChange = {old: calcPrice(oldData.products || []), new: calcPrice(newData.products || [])};
//         }
//
//       }
//
//
//       // TODO: Can be more secured by saving only the allowed fields:
//       // Save the new data with the changes list
//       await transaction.set(orderRef, {
//         ...newData,
//         changes: admin.firestore.FieldValue.arrayUnion(changes),
//         modified: timestamp,
//       }, {merge: true});
//
//       // If the changes were made by the customer, add a notification to the supplier, and v.v.
//       const ref = side == 'c'
//         ? admin.firestore().collection('suppliers').doc(newData.sid || '').collection('my_notifications')
//         : admin.firestore().collection('customers').doc(newData.cid || '').collection('my_notifications');
//
//       await transaction.set(ref.doc(), {
//         ...changes,
//         orderId: newData.id,
//       });
//
//       return true;
//
//     });
//
//   }
//
//   return false;
//
// });
