import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

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
 * Only draft orders can be send!
 */
export const sendOrder = functions.https.onCall(async (orderId: string, context) => {

  const uid: string = context.auth ? context.auth.uid : '';

  if(uid && orderId) {

    return (await admin.firestore().runTransaction(async transaction => {

      // Get the business of the user who committed the call
      const sender = (await transaction.get(admin.firestore().collection('users').doc(uid))).data();

      if(sender && sender.bid) {

        // Get the order data
        const orderRef = admin.firestore().collection('customers').doc(sender.bid).collection('myorders').doc(orderId);
        const order = (await transaction.get(orderRef)).data();

        // If the order is a draft, it is possible to send it
        if(order && order.status === 0) {
          const time = admin.firestore.Timestamp.now().toMillis();
          transaction.update(orderRef, {
            status: 10,
            draft: false,
            changes: admin.firestore.FieldValue.arrayUnion({
              by: uid,
              side: 'c',
              time: time,
              statusChange: {old: 0, new: 10}
            })
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
export const onOrderChange = functions.firestore.document('customers/{customerId}/myorders/{orderId}').onUpdate(async (change, context) => {

  // Get old and new data of the order
  const newData = (change.after ? change.after.data() : null);
  const oldData = (change.before ? change.before.data() : null);

  if(newData && oldData) {

    // The order's new status
    const orderStatus = newData.status;

    // If it's a draft, do nothing and quit the function
    if(!orderStatus)
      return;

    // For changes in order data made directly by users
    if(context && context.authType == 'USER' && context.auth) {

      // Get the user data
      const by = context.auth.uid;
      const userData = (await admin.firestore().collection('users').doc(by).get()).data();

      // Create an object with changes metadata (who and when)
      const changes = {
        by: by,
        side: userData ? userData.side : null,
        time: admin.firestore.Timestamp.now().toMillis(),
      };

      // const calcPrice = (products: any[])=>{
      //   let sum = 0;
      //   products.forEach((po)=>{
      //     sum += (po.pricePerUnit * po.amount);
      //   })
      // };

      // changes['supplyTimeChange'] = {old: oldData.supplyTime, new: newData.supplyTime};
      // changes['commentToSupplierChange'] = {old: oldData.comment, new: newData.comment};
      // changes['priceChange'] = {old: calcPrice(oldData.products), new: calcPrice(newData.supplyTime)};



      // Add the changes into the changes history list of the order
      change.after.ref.update({changes: admin.firestore.FieldValue.arrayUnion(changes)});

    }

    // // For status changes (made by admin through cloud functions)
    // if(newData.status !== oldData.status) {
    //
    // }

  }


});
