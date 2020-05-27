import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {UserDoc, UserRole} from '../../models/UserDoc';
import {UsersService} from '../../services/users.service';
import {AlertsService} from '../../services/alerts.service';

@Component({
  selector: 'app-users-list',
  templateUrl: './users-list.component.html',
  styleUrls: ['./users-list.component.scss'],
})
export class UsersListComponent implements OnInit, OnDestroy {

  // The UID of the selected user
  @Input() selectedUser: string;
  // Disable buttons
  @Input() disabled: boolean;

  // When edit permission button is clicked
  @Output() onEditPermissions = new EventEmitter();

  usersSubscription;

  UserRole = UserRole;

  get users() {
    return this.usersService.users;
  }

  constructor(
    private usersService: UsersService,
    private alerts: AlertsService,
  ) { }

  // Get all users of this business (live updated)
  ngOnInit() {
    this.usersSubscription = this.usersService.myUsersRef.onSnapshot((snapshot)=>{

      // Get all users documents
      this.usersService.users = snapshot.docs.map((doc)=>doc.data() as UserDoc);

      // Sort by roles
      this.usersService.users.sort(((a, b) => b.role - a.role));

    });
  }

  // Stop subscription on component destroy
  ngOnDestroy(): void {
    if(this.usersSubscription)
      this.usersSubscription();
  }


  // Is current user is the admin
  amIAdmin() {
    return this.usersService.myDoc.role == UserRole.ADMIN;
  }


  // Admin and the user himself can edit details
  canEditDetails(user: UserDoc) {
    return this.amIAdmin() || this.usersService.myDoc.uid == user.uid;
  }


  // When selection a user for permissions editing
  onPermissionClicked(user: UserDoc) {
    this.onEditPermissions.emit(this.selectedUser == user.uid ? null : user);
  }


  onEditUserClicked(user: UserDoc) {
    alert('מה למשל אפשר לערוך פה חוץ משם מלא?');
  }


  async onDeleteUserClicked(user: UserDoc) {
    if(await this.alerts.areYouSure('האם למחוק את המשתמש ' + user.displayName + ' לצמיתות?')) {
      const l = this.alerts.loaderStart('מחיקת משתמש...');
      if(await UsersService.DeleteUser(user.uid))
        alert('משתמש נמחק');
      this.alerts.loaderStop(l);
    }
  }

}
