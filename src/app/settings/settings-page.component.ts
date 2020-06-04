import {Component, OnInit} from '@angular/core';
import {BusinessSide} from '../models/Business';
import {NavigationService} from '../services/navigation.service';
import {AuthSoftwareService} from '../services/auth-software.service';
import {UsersService} from '../services/users.service';
import {UserDoc, UserPermission, UserRole} from '../models/UserDoc';
import {AlertController} from '@ionic/angular';

@Component({
  selector: 'app-settings-menu',
  templateUrl: './settings-page.component.html',
  styleUrls: ['./settings-page.component.scss'],
})
export class SettingsPage implements OnInit {

  side: BusinessSide;

  generalOpen: boolean;

  UserPermission = UserPermission;

  constructor(
    private authService: AuthSoftwareService,
    public navService: NavigationService,
    public usersService: UsersService,
    private alertCtrl: AlertController,
  ) {
    this.side = this.authService.currentUser.side;
  }

  get amIAdmin() {
    return this.usersService.myDoc.role == UserRole.ADMIN;
  }

  ngOnInit() {
  }


  // async setEmails() {
  //
  //   // Get users snapshot
  //   this.usersService.users = (await this.usersService.myUsersRef.get()).docs
  //   .map((d)=>d.data() as UserDoc)
  //   .sort((a, b)=>b.role - a.role);
  //
  //   const a = await this.alertCtrl.create({
  //     header: 'הגדרות שליחת דוא"ל',
  //     subHeader: 'התראות במייל תשלחנה למשתמשים הבאים:',
  //     inputs: this.usersService.users.map((user)=>{return {
  //       type: 'checkbox',
  //       label: user.displayName,
  //       value: user.uid,
  //       name: user.uid,
  //       checked: user.emailNotes,
  //     }}),
  //     buttons: [
  //       {
  //         text: 'אישור',
  //
  //         // Update users email notifications settings (true/false) according to the alert's checkboxes
  //         handler: (data: string[])=>{this.usersService.users.forEach((user)=>{
  //           this.usersService.usersCollectionRef.doc(user.uid).update({emailNotes: data.includes(user.uid)});
  //         })},
  //
  //       },
  //       {
  //         text: 'ביטול',
  //         role: 'cancel'
  //       }
  //     ],
  //     backdropDismiss: false,
  //   });
  //   a.present();
  // }

  editBusiness() {



  }

}
