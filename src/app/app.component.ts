import { Component } from '@angular/core';

import { Platform } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import {firebaseConfig} from './FirebaseConfig';
import * as firebase from 'firebase/app';
import 'firebase/analytics';
import 'firebase/auth';
import 'firebase/firestore';
import {MetadataService} from './services/metadata.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss']
})
export class AppComponent {
  constructor(
    private platform: Platform,
    private splashScreen: SplashScreen,
    private statusBar: StatusBar,
    private metadataService: MetadataService,
  ) {
    this.initializeApp();
  }

  initializeApp() {
    this.platform.ready().then(() => {
      this.statusBar.styleDefault();
      this.splashScreen.hide();
    });

    // Initialize firebase
    firebase.initializeApp(firebaseConfig);
    firebase.analytics();

    // Load metadata
    this.metadataService.init(firebase.firestore().collection('metadata'));

    // TODO: Delete this. Test user
    firebase.auth().onAuthStateChanged((user)=>{
      if(!user)
        firebase.auth().signInWithEmailAndPassword('mestroti@gmail.com','123456');
    });

  }

}
