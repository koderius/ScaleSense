
/**
 *
 * XLSX files reader
 * According to: https://github.com/SheetJS/sheetjs/tree/master/demos/angular2
 *
 * */

import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';

@Injectable({
  providedIn: 'root'
})
export class XlsService {

  /** Last workbook that was read */
  public workbook: XLSX.WorkBook;

  /** Last data that was read out of some sheet */
  public data;

  constructor() { }

  get sheetsNames() : string[] {
    return this.workbook ? this.workbook.SheetNames : [];
  }

  /** Get input file event and read the file's data into workbook */
  readExcelWorkbook(evt) : Promise<string[]> {

    const target: DataTransfer = <DataTransfer>(evt.target);
    if (target.files.length !== 1) throw new Error('Cannot use multiple files');

    return new Promise((resolve, reject) => {

      const reader: FileReader = new FileReader();
      reader.onload = (e: any) => {

        /* read workbook */
        const bstr: string = e.target.result;
        this.workbook = XLSX.read(bstr, {type: 'binary'});

        resolve(this.sheetsNames);
      };

      reader.onerror = (e => reject(e));

      reader.readAsBinaryString(target.files[0]);

    });

  }

  /** After a workbook was read, get some sheet's data by sheet's name or by its order index (default: first sheet) */
  readSheetData(sheet : number | string = 0) : string[][] {

    if(!this.workbook)
      return;

    /* grab sheet by index (if number) of by its name */
    const wsname: string = typeof sheet == 'number' ? this.workbook.SheetNames[sheet] : sheet;
    const ws: XLSX.WorkSheet = this.workbook.Sheets[wsname];

    /* save data */
    this.data = XLSX.utils.sheet_to_json(ws, {header: 1});

    return this.data;

  }

}
