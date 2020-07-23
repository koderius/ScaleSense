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

  // The edited user
  userToEdit: UserDoc;

  get users() {
    return this.usersService.users;
  }

  constructor(
    public usersService: UsersService,
    private alerts: AlertsService,
  ) { }

  // Get all users of this business (live updated)
  ngOnInit() {

    this.usersSubscription = this.usersService.myUsersRef().onSnapshot((snapshot)=>{

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


  // Everyone (who has permission to this page) can edit details for equal or lower roles
  canEditDetails(user: UserDoc) {
    return this.usersService.myDoc.role >= user.role;
  }


  // Cannot edit permissions to admin or to myself
  canEditPermissions(user: UserDoc) {
    return user.role != UserRole.ADMIN && user.uid != this.usersService.myDoc.uid;
  }


  // When selection a user for permissions editing
  onPermissionClicked(user: UserDoc) {
    this.userToEdit = null;
    this.onEditPermissions.emit(this.selectedUser == user.uid ? null : user);
  }


  async onEditUserClicked(user: UserDoc) {
    if(this.userToEdit && this.userToEdit.uid == user.uid)
      this.userToEdit = null;
    else
      this.userToEdit = user;
    this.selectedUser = null;
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
