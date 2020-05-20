import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import {ComponentsModule} from './components/components.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {OrderStatusTextPipe} from './pipes/order-status-text.pipe';
import {WeightCameraComponent} from './weight-camera/weight-camera.component';
import {CameraPreview} from '@ionic-native/camera-preview/ngx';
import {Camera} from '@ionic-native/camera/ngx';


@NgModule({
  declarations: [AppComponent, WeightCameraComponent],
  entryComponents: [WeightCameraComponent],
  imports: [BrowserModule, IonicModule.forRoot(), AppRoutingModule, ComponentsModule, BrowserAnimationsModule],
  providers: [
    StatusBar,
    SplashScreen,
    OrderStatusTextPipe,
    CameraPreview,
    Camera,
    {provide: RouteReuseStrategy, useClass: IonicRouteStrategy}
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
