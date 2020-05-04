import { Injectable } from '@angular/core';
import {BusinessService} from './business.service';
import * as firebase from 'firebase/app';
import 'firebase/firestore';
import {ProductCategory} from '../models/Product';

@Injectable({
  providedIn: 'root'
})
export class CategoriesService {

  private _allCategories: ProductCategory[] = [];

  get categoriesRef() {
    return firebase.firestore().collection('customers').doc(this.businessService.myBid).collection('my_categories');
  }

  get allCategories() {
    return this._allCategories.slice();
  }

  get categoriesToShow() {
    return this._allCategories.filter((c)=>c.checked);
  }

  constructor(
    private businessService: BusinessService,
  ) {

    // Subscribe categories list
    this.categoriesRef.orderBy('title').onSnapshot((snapshot)=>{
      this._allCategories = snapshot.docs.map((d)=>d.data() as ProductCategory);
    });

  }


  async updateCategories(updateCategories: ProductCategory[], deleteCategories: string[]) {

    const batch = firebase.firestore().batch();

    // Edit or add new categories
    updateCategories.forEach((c)=>{
      const ref = c.id ? this.categoriesRef.doc(c.id) : this.categoriesRef.doc();
      c.id = ref.id;
      batch.set(ref, c, {merge: true});
    });

    // Delete categories
    deleteCategories.forEach((id)=>{
      batch.delete(this.categoriesRef.doc(id));
    });

    // Commit batch set
    try {
      await batch.commit();
    }
    catch (e) {
      console.error(e);
    }

  }

}
