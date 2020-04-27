import { Injectable } from '@angular/core';
import * as firebase from 'firebase';
import 'firebase/storage';
import {AuthService} from './auth.service';
import Reference = firebase.storage.Reference;

@Injectable({
  providedIn: 'root'
})
export class FilesService {

  constructor(
    private authService: AuthService,
  ) { }

  /** All the files will be stored in a directory named after the business ID */
  get storageRef() {
    return firebase.storage().ref(this.authService.currentUser.bid);
  }

  async uploadFile(file: File, objectId: string) : Promise<string> {

    // Store the file under its Object's ID
    const ref = this.storageRef.child(objectId);

    // Upload the file and return the download URL
    try {
      const res = await ref.put(file);
      if(res)
        return res.ref.getDownloadURL();
    }
    catch (e) {
      console.error(e);
    }

  }


  async deleteFile(idOrUrl: string) {

    let ref: Reference;

    // Delete file by its URL
    if(idOrUrl.includes('/'))
      ref = firebase.storage().refFromURL(idOrUrl);

    // Delete file by its object's ID
    else
      ref = this.storageRef.child(idOrUrl);

    await ref.delete();

  }


  static ReadFile(file: File) : Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve(reader.result as string);
      };
      reader.onerror = (e)=> {
        console.error(e);
        reject(e);
      };
      reader.readAsDataURL(file);
    });
  };

}
