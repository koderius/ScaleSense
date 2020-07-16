import {Component, OnInit} from '@angular/core';
import {SuppliersService} from '../services/suppliers.service';
import {NavigationService} from '../services/navigation.service';
import {BusinessDoc, SupplierDoc, SupplierStatus} from '../models/Business';
import {AlertsService} from '../services/alerts.service';
import {XlsService} from '../services/xls.service';
import {XlsParseService} from '../services/xls-parse.service';

@Component({
  selector: 'app-suppliers-list',
  templateUrl: './suppliers-list.page.html',
  styleUrls: ['./suppliers-list.page.scss'],
})
export class SuppliersListPage implements OnInit {

  SupplierStatus = SupplierStatus;

  query: string = '';

  filteredSuppliers: SupplierDoc[];

  page: number = 1;

  get results() {
    return (this.filteredSuppliers || this.suppliersService.mySuppliers).slice((this.page - 1) * 10, this.page * 10);
  }

  constructor(
    public suppliersService: SuppliersService,
    public navService: NavigationService,
    private alerts: AlertsService,
    private xlsReader: XlsService,
    private xlsParse: XlsParseService,
  ) { }

  ngOnInit() {}

  search() {
    const q = this.query ? this.query.toLocaleLowerCase() : '';
    this.filteredSuppliers = this.suppliersService.mySuppliers.filter((s)=>s.name.toLocaleLowerCase().includes(q));
  }

  async deleteSupplier(supplier: BusinessDoc) {
    if (await this.alerts.areYouSure('האם למחוק את הספק "' + supplier.name + '"?')) {
      const l = this.alerts.loaderStart('מוחק ספק...');
      await this.suppliersService.deleteSupplier(supplier.id);
      this.alerts.loaderStop(l);
      this.search();
    }
  }


  async importFromExcel(ev) {
    // Read the excel file and its first sheet
    await this.xlsReader.readExcelWorkbook(ev);
    const table = this.xlsReader.readSheetData();
    // Parse file and set suppliers
    const numOfSuppliers = await this.xlsParse.setSuppliers(table);
    if(numOfSuppliers)
      alert('פרטי ' + numOfSuppliers + ' ספקים הוגדרו מתוך מטבלה');
  }


  hasAllRequired(supplier: SupplierDoc) {
    return supplier.nid && supplier.name && supplier.logo && supplier.companyId &&
      supplier.contacts && supplier.contacts[0] && supplier.contacts[0].name && supplier.contacts[0].email && supplier.contacts[0].phone;
  }

}
