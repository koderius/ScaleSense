import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-accessibility',
  templateUrl: './accessibility.component.html',
  styleUrls: ['./accessibility.component.scss'],
})
export class AccessibilityComponent implements OnInit {

  AccessibilityComponent = AccessibilityComponent;

  static readonly LOCAL_STORAGE_KEY = 'scale-sense_acc';

  // Set some property in local storage
  static SaveToLocalStorage() {
    const obj = {
      bnw: AccessibilityComponent.BnW,
      soft: AccessibilityComponent.SoftColors,
      zoom: AccessibilityComponent.Zoom,
    };
    localStorage.setItem(AccessibilityComponent.LOCAL_STORAGE_KEY, JSON.stringify(obj));
  }

  static LoadFromLocalStorage() {
    const ls = localStorage.getItem(AccessibilityComponent.LOCAL_STORAGE_KEY);
    if(ls) {
      const obj = JSON.parse(ls);
      AccessibilityComponent.BnW = obj['bnw'];
      AccessibilityComponent.SoftColors = obj['soft'];
      AccessibilityComponent.Zoom = obj['zoom'];
    }
  }

  static get Zoom() {
    return +getComputedStyle(document.documentElement).getPropertyValue('--ion-zoom');
  }

  static set Zoom(zoom: number) {
    document.documentElement.style.setProperty('--ion-zoom', zoom+'');
  }

  static get BnW() {
    return document.body.classList.contains('gray');
  }

  static set BnW(on: boolean) {
    document.body.classList.toggle('gray', on);
  }

  static get SoftColors() {
    return document.body.classList.contains('soft');
  }

  static set SoftColors(on: boolean) {
    document.body.classList.toggle('soft', on);
  }

  constructor() { }

  ngOnInit() {}

  zoomIn() {
    AccessibilityComponent.Zoom += 0.1;
  }

  zoomOut() {
    AccessibilityComponent.Zoom -= 0.1;
  }

  reset() {
    AccessibilityComponent.BnW = false;
    AccessibilityComponent.SoftColors = false;
    AccessibilityComponent.Zoom = 1;
  }

}
