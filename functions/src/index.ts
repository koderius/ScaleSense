import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import {OrderChange, OrderDoc, ProductOrder} from '../../src/app/models/OrderI';

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


/**
 * The function gets an order ID and send it to the supplier.
 * The process of sending is just updating the order status from DRAFT (0) to SENT (10). This will grant the supplier the option to see the order.
 * In order to do so, the function recognizes the user who committed the call, finds his business ID, and then finds the order inside the business.
 * Only draft orders can be send.
 * Add notification to the supplier.
 * Return whether the operation succeed.
 */
export const sendOrder = functions.https.onCall(async (orderId: string, context) => {

  const uid: string = context.auth ? context.auth.uid : '';

  if(uid && orderId) {

    return (await admin.firestore().runTransaction(async transaction => {

      // Get the business of the user who committed the call
      const sender = (await transaction.get(admin.firestore().collection('users').doc(uid))).data();

      if(sender && sender.bid) {

        // Get the order data
        const orderRef = admin.firestore().collection('customers').doc(sender.bid).collection('my_orders').doc(orderId);
        const order = (await transaction.get(orderRef)).data();

        // If the order is a draft, it is possible to send it
        if(order && order.status === 0) {

          // Create changes report
          const changes = {
            by: uid,
            side: 'c',
            time: admin.firestore.Timestamp.now().toMillis(),
            statusChange: {old: 0, new: 10}
          };

          // Update the order
          transaction.update(orderRef, {
            status: 10,
            draft: false,
            changes: admin.firestore.FieldValue.arrayUnion(changes)
          });

          // Send notification to the supplier
          transaction.set(admin.firestore().collection('suppliers').doc(order.sid).collection('my_notifications').doc(), {
            ...changes,
            orderId: orderId,
          });

          return true;
        }

      }

      return false;

    }));

  }

  return await false;

});


/**
 * This function is being automatically called when an order is being updated.
 * The function ignores changes in drafts, because changes in draft has no consequences in the app.
 * - Notice: The function works on update only - not on creation (because it's a draft) and not on deletion (only drafts can be deleted)
 */
export const onOrderUpdate = functions.firestore.document('customers/{customerId}/my_orders/{orderId}').onUpdate(async (change, context) => {

  // Get old and new data of the order
  const newData = (change.after ? change.after.data() : null) as OrderDoc;
  const oldData = (change.before ? change.before.data() : null) as OrderDoc;

  if(newData && oldData && context) {

    console.log('has new & old data');

    // The order's new status
    const orderStatus = newData.status;

    // If it's a draft, do nothing and quit the function
    if(!orderStatus)
      return;

    console.log('has status');

    // For changes in order data made directly by users
    if(context.auth && context.authType == 'USER') {

      console.log('by user');

      admin.firestore().runTransaction(async (transaction)=>{

        // Get the user data, and his business belonging
        const uid = context.auth ? context.auth.uid : 'null';
        const userData = (await transaction.get(admin.firestore().collection('users').doc(uid))).data();
        const side = userData ? userData.side : null;

        // Create a changes report object (who and when)
        const changes: OrderChange = {
          by: uid,
          side: side,
          time: admin.firestore.Timestamp.now().toMillis(),
        };

        // Check changes in general order details
        if(oldData.supplyTime != newData.supplyTime)
          changes.supplyTimeChange = {old: oldData.supplyTime || NaN, new: newData.supplyTime || NaN};
        if(oldData.comment != newData.comment)
          changes.commentToSupplierChange = {old: oldData.comment || '', new: newData.comment || ''};

        // Check changes in products list
        changes.productsChanges = [];

        // Get a list of all products IDs
        const allProducts = new Set<string>();
        [...(newData.products || []), ...(oldData.products || [])].forEach((p)=>{allProducts.add(p.id)});

        // Check differences between each product
        allProducts.forEach((id)=>{

          const oldProduct = (oldData.products || []).find((p)=>p.id == id);
          const newProduct = (newData.products || []).find((p)=>p.id == id);

          // If there are differences, add the old version and the new version
          if(JSON.stringify(oldProduct || {}) != JSON.stringify(newProduct || {}) && changes.productsChanges)
            changes.productsChanges.push({old: oldProduct || null, new: newProduct || null});

        });

        // Update the price if there are changes in the products list
        if(changes.productsChanges && changes.productsChanges.length) {
          const calcPrice = (products: ProductOrder[])=>{
            let sum = 0;
            products.forEach((po)=>{
              sum += ((po.pricePerUnit || 0) * (po.amount || 0));
            });
            return sum;
          };
          changes.priceChange = {old: calcPrice(oldData.products || []), new: calcPrice(newData.products || [])};
        }

        // Add the changes into the changes history list of the order
        await transaction.update(change.after.ref, {changes: admin.firestore.FieldValue.arrayUnion(changes)});

        const customerId = context.params ? context.params.customerId : null;
        const supplierId = newData.sid || '';

        // If the changes were made by the customer, add a notification to the supplier, and v.v.
        const ref = side == 'c'
          ? admin.firestore().collection('suppliers').doc(supplierId).collection('my_notifications')
          : admin.firestore().collection('customers').doc(customerId).collection('my_notifications');

        transaction.set(ref.doc(), {
          ...changes,
          orderId: newData.id
        });

      });


    }

  }


});
