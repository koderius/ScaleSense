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
 * The function get an order ID and send it to the supplier.
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
        if(order && !order.status) {
          transaction.update(orderRef, {status: 10});
          return true;
        }

      }

      return false;

    }));

  }

  return await false;

});
