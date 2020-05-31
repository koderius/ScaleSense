import { Component, OnInit } from '@angular/core';
import {CategoriesService} from '../services/categories.service';
import {ProductCategory} from '../models/ProductI';
import {AlertsService} from '../services/alerts.service';
import {UserPermission} from '../models/UserDoc';
import {UsersService} from '../services/users.service';
import {NavigationService} from '../services/navigation.service';

@Component({
  selector: 'app-categories-list',
  templateUrl: './categories-list.page.html',
  styleUrls: ['./categories-list.page.scss'],
})
export class CategoriesListPage implements OnInit {

  categories: ProductCategory[] = [];

  categoriesToEdit = new Set<string>();
  idsToDelete: string[] = [];

  constructor(
    private categoriesService: CategoriesService,
    private alerts: AlertsService,
  ) { }

  ngOnInit() {

    this.categories = this.categoriesService.allCategories;

    // If has not loaded yet, retry in 1 second
    if(!this.categories)
      setTimeout(()=>{
        this.ngOnInit();
      }, 1000)

  }

  async addCategory() {
    const title = await this.alerts.inputAlert('יצירת קטגוריה חדשה', 'הזן שם קטגוריה');
    const newCategory = {
      id: null,
      title: title,
      checked: true,
    };
    this.categories.push(newCategory);
  }


  async editCategoryTitle(c: ProductCategory) {
    c.title = await this.alerts.inputAlert('שינוי שם קטגוריה','הזן שם קטגוריה', c.title);
    this.onCategoryChanged(c);
  }


  onCategoryChanged(c: ProductCategory) {
    if(c.id)
      this.categoriesToEdit.add(c.id);
  }


  async removeCategory(idx: number, c: ProductCategory) {
    const res = await this.alerts.areYouSure('מחיקת קטגוריה', 'האם למחוק לגמרי את הקטגוריה ' + c.title + '?');
    if(res) {
      this.categories.splice(idx,1);
      if(c.id)
        this.idsToDelete.push(c.id);
    }
  }


  async saveChanges() {

    // Get all new categories (with no ID) and categories that were changed
    const categoriesToSet = this.categories.filter((c)=>!c.id || this.categoriesToEdit.has(c.id));

    // Save changes
    const l = this.alerts.loaderStart('שומר קטגוריות...');
    await this.categoriesService.updateCategories(categoriesToSet, this.idsToDelete);
    this.alerts.loaderStop(l);

  }

}
