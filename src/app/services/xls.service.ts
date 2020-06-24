
/**
 *
 * XLSX files reader
 * According to: https://github.com/SheetJS/sheetjs/tree/master/demos/angular2
 *
 * */

import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';
import {AuthService} from './auth.service';
import {BusinessService} from './business.service';
import {of} from 'rxjs';
import {formatDate, formatNumber} from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class XlsService {

  /** Last workbook that was read */
  public workbook: XLSX.WorkBook;

  /** Last data that was read out of some sheet */
  public data;

  constructor(
    private authService: AuthService,
    private businessService: BusinessService,
  ) { }

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


  createExcel(data: any[][], headers: string[], fileName: string, title?: string, subject?: string,) {

    // Create new book
    const workBook = XLSX.utils.book_new();

    // Add headers
    data.unshift(headers);

    // Translate data and create new sheet
    XlsService.TranslateData(data);
    const sheet = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(workBook, sheet);

    // File format
    const bookType = 'xlsx';
    fileName = fileName + '.' + bookType;

    // Download file
    const file = XLSX.writeFile(workBook, fileName,{
      type: 'file',
      bookType: bookType,
      Props: {
        Author: this.authService.currentUser.displayName,
        CreatedDate: new Date(),
        Company: this.businessService.businessDoc.name,
        Title: title,
        Subject: subject,
      }
    });

    console.log(file);

  }

  static TranslateData(data: any[][]) {

    data.forEach((row, i)=>{
      row.forEach((cell, j)=>{

        // Numbers into formatted strings
        if(typeof cell == 'number')
          data[i][j] = formatNumber(cell, 'en-US', '1.0-3').replace(/,/g, '');

        // To date format that excel can read
        if(cell instanceof Date || (typeof cell == 'number' && (''+cell).length === 13 && (''+cell).startsWith('1')))
          data[i][j] = formatDate(cell, 'dd/MM/yyyy HH:mm:ss', 'en-US');

        // No data
        if(cell === undefined || cell === null)
          data[i][j] = '';

      });
    });

  }

}
