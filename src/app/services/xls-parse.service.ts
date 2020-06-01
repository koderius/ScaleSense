import { Injectable } from '@angular/core';
import {SuppliersService} from './suppliers.service';
import {SupplierDoc} from '../models/Business';
import {Objects} from '../utilities/objects';

@Injectable({
  providedIn: 'root'
})
export class XlsParseService {

  constructor(
    private supplierService: SuppliersService,
  ) { }

  async setSuppliers(table: string[][]) : Promise<number> {

    // Ignore the first row (header)
    table = table.slice(1);

    const promises = [];

    table.forEach((row)=>{

      // Get supplier's serial number, and check it's valid
      const nid = +row[0];
      if(!nid)
        return;

      // Create a document based on the NID
      const supplier: SupplierDoc = {nid: nid};

      // Get all other properties
      supplier.name = row[1];
      supplier.logo = row[2];
      supplier.companyId = row[3];
      supplier.address = row[4];
      supplier.businessPhone = row[5];
      supplier.fax = row[6];
      supplier.contacts = [
        {
          name: row[7],
          phone: row[8],
          email: row[9],
        },
        {
          name: row[10],
          phone: row[11],
          email: row[12],
        }
      ];

      Objects.ClearUndefined(supplier);

      try {
        promises.push(this.supplierService.saveSupplierDoc(supplier));
      }
      catch (e) {
        console.error(e);
      }

    });

    await Promise.all(promises);
    return promises.length;

  }

}
