import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivateChild, RouterStateSnapshot} from '@angular/router';
import {BusinessSide} from './models/Business';
import {UserRole} from './models/UserDoc';
import {AuthService} from './services/auth.service';
import {NavigationService} from './services/navigation.service';
import {AlertController} from '@ionic/angular';

/**
 * This guard prevents users entering pages, if they don't have the requested requirements
 * */

@Injectable({
  providedIn: 'root'
})
export class AppEnterGuard implements CanActivateChild {

  // User subscriber
  userSubscription;

  // Sign in alert
  alert;

  // The side that this page belong to, if not specified, opened for both
  side: BusinessSide;
  // The permissions that are required to enter this page
  permissions: string[];
  // Whether only the admin can enter the page
  adminOnly: boolean;

  constructor(
    private authService: AuthService,
    private alertCtrl: AlertController,
    private navService: NavigationService,
  ) {}


  async canActivateChild(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean> {

    // Get parameters from route data, that describe the user requirements
    if(route.data) {
      this.side = route.data['side'];
      this.permissions = route.data['permissions'];
      this.adminOnly = route.data['adminOnly'];
    }

    // Get the user data, or wait auth is ready
    return await new Promise<boolean>(resolve => {
      this.userSubscription = this.authService.onCurrentUser.subscribe((user)=>{
        // Check the user's requirements
        if(user) {
          resolve(this.checkUser() || this.throwBack());
          if(this.alert)
            this.alert.dismiss();
          this.userSubscription.unsubscribe();
        }
        // Ask user to sign in
        else
          this.popSignIn();
      });
    });

  }


  // Check the current user pass all page's requirements. (Unsigned user will pass if there are no requirements)
  checkUser() {

    const user = this.authService.currentUser;

    // Check user's side - if needed
    if(this.side && user.side != this.side)
      return false;

    // Check user is admin - if needed
    if(this.adminOnly && user.role != UserRole.ADMIN)
      return false;

    // Check user's permissions - if needed
    if(this.permissions && this.permissions.length && this.permissions.some((p)=>!this.hasPermission(p)))
      return false;

    // If passed all
    return true;

  }


  // Whether the user has some requested permission
  hasPermission(p: string) : boolean {
    const userDoc = this.authService.currentUser;
    return userDoc.role == UserRole.ADMIN || (userDoc.permissions && userDoc.permissions[p]);
  }


  // Ask user to sign in. If fails, retry
  async popSignIn() {

    // Pop sign in alert
    this.alert = await this.alertCtrl.create({
      header: 'התחברות ל-Scale-Sense',
      inputs: [
        {
          placeholder: 'כתובת דוא"ל',
          type: 'email',
          name: 'email'
        },
        {
          placeholder: 'סיסמא',
          type: 'password',
        }
      ],
      buttons: [{
        text: 'התחברות',
        role: 'sign-in'
      }],
      backdropDismiss: false,
    });
    this.alert.present();

    // Try to sign in with the inputs data, pop the alert again if failed
    const res = await this.alert.onDidDismiss();
    if(res.data.role == 'sign-in' && !await this.authService.signIn(res.data.values[0], res.data.values[1]))
      this.popSignIn();

  }


  // Throw user back the website
  throwBack() : false {
    alert('אין הרשאה לכניסה לעמוד');
    this.navService.goToWebHomepage();
    return false;
  }

}
