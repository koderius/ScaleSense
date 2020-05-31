import { Injectable } from '@angular/core';
import {BusinessService} from './business.service';
import * as firebase from 'firebase/app';
import 'firebase/firestore';
import {ProductCategory} from '../models/ProductI';

/**
 * This service is in charged of categories management (CRUD) (relevant for customer only)
 * It loads the customer's private categories list and keeps subscribing for changes.
 */

@Injectable({
  providedIn: 'root'
})
export class CategoriesService {

  /** All categories */
  private _allCategories: ProductCategory[];

  /** Reference to customer's private categories collection */
  get categoriesRef() {
    return firebase.firestore().collection('customers').doc(this.businessService.myBid).collection('my_categories');
  }

  /** Get a copy of all categories */
  get allCategories() {
    return this._allCategories ? this._allCategories.slice() : null;
  }

  /** Get only the categories that were defined to be shown */
  get categoriesToShow() {
    return this._allCategories ? this._allCategories.filter((c)=>c.checked) : [];
  }

  constructor(
    private businessService: BusinessService,
  ) {

    // Subscribe categories list
    this.categoriesRef.orderBy('title').onSnapshot((snapshot)=>{
      this._allCategories = snapshot.docs.map((d)=>d.data() as ProductCategory);
    });

  }


  /** Update (create or change) and delete categories */
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
