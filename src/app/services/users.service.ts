import { Injectable } from '@angular/core';
import {UserDoc} from '../models/UserDoc';
import * as firebase from 'firebase/app';
import 'firebase/functions';

@Injectable({
  providedIn: 'root'
})
export class UsersService {

  constructor() { }


  async createNewUser(doc: Partial<UserDoc>, password: string) : Promise<UserDoc> {
    try {
      const createUser = firebase.functions().httpsCallable('createUser');
      return (await createUser({userDoc: doc, password: password})).data;
    }
    catch (e) {
      console.error(e);
    }
  }

}
