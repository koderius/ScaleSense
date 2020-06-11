import {EventEmitter, Injectable} from '@angular/core';
import * as firebase from 'firebase/app';
import 'firebase/firestore';
import 'firebase/auth';
import {FirebaseError, User} from 'firebase';
import {UserDoc} from '../models/UserDoc';
import {ActivatedRoute} from '@angular/router';
import UserCredential = firebase.auth.UserCredential;
import {Observable} from 'rxjs';

export enum AuthStage {

  NONE = '',

  VERIFICATION_SENT = 'verificationSent',
  VERIFY_EMAIL = 'verifyEmail',              // From URL param
  EMAIL_VERIFIED = 'emailVerified',

  FORGOT_PASSWORD = 'forgotPassword',
  RESET_PASSWORD_SENT = 'resetPasswordSent',
  RESET_PASSWORD = 'resetPassword',      // From URL param
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  // Regular expresion for password/username (alphanumeric + underscore, minimum 6 chars)
  public static readonly PASSWORD_REGEX = '^[a-zA-Z0-9_]{6,}$';
  // Regular expresion for email address
  public static readonly EMAIL_REGEX = '^(([^<>()\\[\\]\\\\.,;:\\s@"]+(\\.[^<>()\\[\\]\\\\.,;:\\s@"]+)*)|(".+"))@((\\[[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\])|(([a-zA-Z\\-0-9]+\\.)+[a-zA-Z]{2,}))$';

  // Firebase modules
  private readonly auth = firebase.auth();
  private readonly usersCollection = firebase.firestore().collection('users');

  // Current firebase user & current user's app document
  private _user: User;
  private _userDoc: UserDoc;

  // Document's reference unsubscribe function
  private docSubscription: ()=>void;

  // False during auth change, becomes true when "onDocChange" emits (user's document is ready or no user)
  private isAuthReady: boolean = false;
  // Emits after user has signed in and his document data was loaded, or on sign out
  private onDocChange = new EventEmitter<void>();

  // The current stage for some auth processes - Mostly for UI.
  // Some stages are defined by the URL 'mode' parameter (like when entering through reset password email)
  private _stage = AuthStage.NONE;
  // Code from the URL (in email verification, password reset, etc...)
  private readonly _oobCode: string;

  // Emits when there is some auth error
  public onAuthError = new EventEmitter<FirebaseError>();

  // Get the current user (if ready), and then subscribe every document change or auth change
  public onCurrentUser = new Observable<UserDoc | null>(subscriber => {
    if(this.isAuthReady)
      subscriber.next(this.currentUser);
    const childSub = this.onDocChange.subscribe(()=>{
      subscriber.next(this.currentUser);
    });
    // Add the inner subscription to the unsubscribe chain (so it will unsubscribe to when unsubscribe the main)
    subscriber.add(childSub);
  });

  // Get current user's document. Only if user's document has loaded, and the user's email is verified
  get currentUser(): UserDoc | null {
    return (this._user && (this._user.emailVerified || true) && this._userDoc) || null;
    //                             TODO: delete this ^
  }

  // Whether the user's email is verified
  get isUserVerified() : boolean {
    return this._user && this._user.emailVerified;
  }


  constructor(private activatedRoute: ActivatedRoute) {

    // On sign in/out
    this.auth.onAuthStateChanged((user: User)=>{

      this.isAuthReady = false;

      // Get the user, or null when signed out or no one is signed in
      console.log('Current user:', user);
      this._user = user;

      // Stop previous document subscription (if there is)
      if(this.docSubscription)
        this.docSubscription();

      // On user's sign-in
      if (user) {

        // Start subscribing user's document.
        this.docSubscription = this.usersCollection.doc(user.uid).onSnapshot((snapshot)=>{
          this._userDoc = snapshot.data() as UserDoc;
          this.isAuthReady = true;
          this.onDocChange.emit();
        },
          (e: FirebaseError)=>{
          e.code = 'userDocSubscribe';
          this.onAuthError.emit(e);
        });

        // When the user document suddenly becomes not available (on sign out), go to the main page
        this.onDocChange.subscribe(()=>{
          if(!this.currentUser)
            window.location.href = '';
        });

      }
      // On user's sign-out (or no user is signed from the beginning)
      else {
        this.isAuthReady = true;
        this.onDocChange.emit();
      }

    });

    // When loading with email verification or reset password link
    const urlParams = this.activatedRoute.snapshot.queryParams;
    this._oobCode = urlParams['oobCode'] as string;
    this._stage = urlParams['mode'] as AuthStage.VERIFY_EMAIL | AuthStage.RESET_PASSWORD;

    // If the link is a verification link, verify the email
    if(this._stage == AuthStage.VERIFY_EMAIL)
      this.verifyEmail();

  }


  // Get some user's document
  async getUserDoc(uid: string) : Promise<UserDoc | null> {
    if (this.currentUser && this.currentUser.uid == uid)
      return this.currentUser;
    else {
      try {
        return (await this.usersCollection.doc(uid).get()).data() as UserDoc;
      }
      catch (e) {
        this.onAuthError.emit(e);
      }
    }
  }


  // Sign in with email & password
  async signIn(email: string, password: string) : Promise<UserCredential> {
    try {
      return await this.auth.signInWithEmailAndPassword(email, password);
    }
    catch (e) {
      this.onAuthError.emit(e);
    }
  }

  // Sign out (will set the user doc to null, and then navigate to the main page)
  async signOut() : Promise<void> {
    await this.auth.signOut();
  }


  // Get current auth stage
  get authStage() : AuthStage {
    return this._stage;
  }

  // Send the user an email with verification link
  async sendEmailVerification() : Promise<void> {
    try {
      await this._user.sendEmailVerification();
      this._stage = AuthStage.VERIFICATION_SENT;
    }
    catch (e) {
      this.onAuthError.emit(e);
    }
  }

  // Verify the email according to current URL (auto emit by URL)
  private async verifyEmail() {
    try {
      await this.auth.applyActionCode(this._oobCode);
      await this._user.reload();
      this._stage = AuthStage.EMAIL_VERIFIED;
    }
    catch (e) {
      this.onAuthError.emit(e);
    }
  }


  // Only set the stage to 'forgotPassword' (for UI)
  forgotPassword() {
    this._stage = AuthStage.FORGOT_PASSWORD;
  }

  // Send a reset password email
  async sendPasswordResetEmail(email: string) : Promise<void> {
    try {
      await this.auth.sendPasswordResetEmail(email);
      this._stage = AuthStage.RESET_PASSWORD_SENT;
    }
    catch (e) {
      this.onAuthError.emit(e);
    }
  }

  // Reset the password after entering the app through the reset password link, and entered a new password
  async resetPasswordAndSignIn(newPassword: string) : Promise<void> {
    try {
      if(this._oobCode) {
        // Verify the code and get the referred email
        const email = await this.auth.verifyPasswordResetCode(this._oobCode);
        // Reset to the given new password
        await this.auth.confirmPasswordReset(this._oobCode, newPassword);
        // Auto sign in
        await this.signIn(email, newPassword);
      }
    }
    catch (e) {
      this.onAuthError.emit(e);
    }
  }

}
