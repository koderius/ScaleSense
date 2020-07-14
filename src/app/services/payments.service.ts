import {EventEmitter, Injectable} from '@angular/core';
import * as firebase from 'firebase/app';
import 'firebase/functions';
import 'firebase/firestore';
import {ContactInfo} from '../models/Business';
import {AuthService} from './auth.service';
import {Payment} from '../models/Payment';
import {first} from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class PaymentsService {

  private readonly TERMINAL_TEST = '0010156315';
  private readonly API_KEY_TEST = 'b6589fc6ab0dc82cf12099d1c2d40ab994e8410c';
  private readonly PASSWORD_TEST = 'scale';

  private readonly TEMINAL = '';
  private readonly API_KEY = '';

  private readonly MOCK_API_URL = 'https://private-anon-b3d4a3a189-yaadpay.apiary-mock.com/p3/';

  private readonly API_URL = 'https://icom.yaad.net/p3/';

  readonly paymentsRef = firebase.firestore().collection('payments');

  // The current signed in business (according to the signed in user)
  private currentBid: string;
  // Business's payment firestore subscription
  private paymentSubscription;
  // Has payments data been loaded
  private paymentReady: boolean;
  // Emits when payments data loaded
  public onPaymentReady = new EventEmitter<void>();
  // Payment data
  private _paymentData: Payment;

  get validUntil() : Date {
    return this._paymentData && this._paymentData.validUntil ? new Date(this._paymentData.validUntil) : null;
  }

  get paymentData() {
    return {...this._paymentData};
  }


  constructor(
    private authService: AuthService,
  ) {

    // Subscribe the current business
    this.authService.onCurrentUser.subscribe((user)=>{

      const userBid = user ? user.bid : null;

      if(userBid != this.currentBid) {

        // Current BID
        this.currentBid = userBid;
        this.paymentReady = false;

        // Stop payment subscription of the previous business (if there is)
        if(this.paymentSubscription)
          this.paymentSubscription();

        // Subscribe the payments data, and update the expiration date
        if(this.currentBid)

          this.paymentSubscription = this.paymentsRef.doc(this.currentBid).onSnapshot((snapshot)=>{
            this._paymentData = snapshot.data() as Payment || {};
            this.paymentReady = true;
            this.onPaymentReady.emit();
          });

        else
          this._paymentData = null;

      }

    });

  }


  /** whether payment is valid (before expiration time). Wait for payment to be ready if needed */
  async isValid() : Promise<boolean> {

    return new Promise<boolean>(resolve => {

      if(this.authService.currentUser.side == 's')
        resolve(true);

      if(this.paymentReady)
        resolve(this._paymentData && this._paymentData.validUntil > Date.now());
      else
        this.onPaymentReady.pipe(first()).subscribe(()=>{
          resolve(this._paymentData && this._paymentData.validUntil > Date.now());
        });

    });

  }


  /** Get link for payment according to API parameters */
  async pay(bid: string, contact: ContactInfo, retry?: boolean) {

    const url = new URL(this.API_URL);

    // Required
    url.searchParams.append('action', 'APISign');
    url.searchParams.append('What', 'SIGN');
    url.searchParams.append('Masof', this.TERMINAL_TEST);
    url.searchParams.append('KEY', this.API_KEY_TEST);
    url.searchParams.append('PassP', this.PASSWORD_TEST);
    url.searchParams.append('Info','test');
    url.searchParams.append('UTF8', 'True');
    url.searchParams.append('UTF8out', 'True');
    url.searchParams.append('Sign', 'False');

    // Details
    url.searchParams.append('tmp', '3');
    url.searchParams.append('PageLang', 'HEB');
    url.searchParams.append('MoreData', 'True');
    url.searchParams.append('pageTimeOut', 'True');
    url.searchParams.append('FixTash', 'True');
    url.searchParams.append('Tash', '12');
    url.searchParams.append('Amount', '21600');

    // HORAAT KEVA
    // url.searchParams.append('HK', 'True');
    // url.searchParams.append('Amount', '1800');
    // url.searchParams.append('Tash', '999');
    // url.searchParams.append('OnlyOnApprove', 'True');

    // Client details
    url.searchParams.append('ClientName', contact.name.split(' ')[0]);
    url.searchParams.append('ClientLName', contact.name.split(' ')[1]);
    url.searchParams.append('email', contact.email);
    url.searchParams.append('phone', contact.phone);
    url.searchParams.append('Order', bid);

    // Get the payment link from the API and return it
    const fn = firebase.functions().httpsCallable('payment');
    try {
      const res = await fn(url.href);
      const responseParams: string = res.data;
      return this.API_URL + '?action=pay&' + responseParams;
    }
    catch (e) {
      console.error(e);
      if(!retry)
        return await this.pay(bid, contact, true);
    }

  }


  /** Verify payment from received query URL parameters after the payment has been made, and return the new expiring date */
  async verifyPayment(queryParams: string, retry?: boolean) : Promise<Date> {

    const url = new URL(this.API_URL + queryParams);
    url.searchParams.append('action', 'APISign');
    url.searchParams.append('What', 'VERIFY');
    url.searchParams.append('Masof', this.TERMINAL_TEST);
    url.searchParams.append('KEY', this.API_KEY_TEST);
    url.searchParams.append('PassP', this.PASSWORD_TEST);

    try {
      const fn = firebase.functions().httpsCallable('verifyPayment');
      const res = await fn(url.href);
      return new Date(res.data as number);
    }
    catch (e) {
      console.error(e);
      if(!retry)
        return await this.verifyPayment(queryParams, true);
    }

  }


}
