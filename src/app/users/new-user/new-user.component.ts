import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {UserDoc, UserRole} from '../../models/UserDoc';
import {Enum} from '../../utilities/enum';
import {AbstractControl, FormControl, Validators} from '@angular/forms';
import {UsersService} from '../../services/users.service';
import {AlertsService} from '../../services/alerts.service';

@Component({
  selector: 'app-new-user',
  templateUrl: './new-user.component.html',
  styleUrls: ['./new-user.component.scss'],
})
export class NewUserComponent implements OnInit {

  // Form validators
  email = new FormControl('', [Validators.required, Validators.email]);
  fullName = new FormControl('', [Validators.required]);
  userName = new FormControl('', [Validators.required, Validators.minLength(6)]);
  password = new FormControl('', [Validators.required, Validators.minLength(6)]);
  passwordV = new FormControl('', [Validators.required, this.checkPasswordV()]);
  role = new FormControl('', [Validators.required]);

  // Whether or not to be visible
  @Input() show: boolean;
  // User to edit. If null, create new user
  @Input() editUser: UserDoc;

  // Emits when user has been created (or edited)
  @Output() userCreated = new EventEmitter();

  // Roles enum
  UserRole = UserRole;
  // List of roles according to enum
  roles = Enum.ListEnum(UserRole) as number[];

  constructor(
    private alerts: AlertsService,
  ) { }

  ngOnInit() {
    if(this.editUser) {
      this.email.setValue(this.editUser.email);
      this.fullName.setValue(this.editUser.displayName);
      this.userName.setValue(this.editUser.username);
      this.role.setValue(this.editUser.role);
    }
  }


  // All form controllers
  get allControls() : FormControl[] {
    const ar = [];
    for (let p in this)
      if(this[p] instanceof FormControl)
        ar.push(this[p]);
    return ar;
  }


  // Check password validator
  checkPasswordV() {
    return (control: AbstractControl)=> {
      if(this.password.value != control.value)
        return {notSimilar: {value: control.value}};
      else
        return null;
    }
  }


  // Whether all fields have valid values
  allValid() {
    return this.allControls.every((c)=>c.valid);
  }

  // Create user
  async createUser() {

    // Create user document with initial details
    const doc: Partial<UserDoc> = {
      displayName: this.fullName.value,
      email: this.email.value,
      username: this.userName.value,
      role: this.role.value,
    };

    // If it's a user to edit, supply also his UID
    if(this.editUser)
      doc.uid = this.editUser.uid;

    // Create user
    const l = this.alerts.loaderStart(this.editUser ? 'שומר פרטי משתמש' : 'יוצר משתמש חדש...');
    const userDoc = await UsersService.CreateNewUser(doc, this.password.value);
    this.alerts.loaderStop(l);

    // On success
    if(userDoc) {
      alert(this.editUser ? 'פרטי משתמש נשמרו' : 'משתמש חדש נוצר בהצלחה');
      // Emit data
      this.userCreated.emit(userDoc);
      // Clear all fields
      this.allControls.forEach((c)=>c.reset());
    }

  }

}
