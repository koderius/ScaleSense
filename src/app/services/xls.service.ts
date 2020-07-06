
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
import {formatDate, formatNumber} from '@angular/common';
import {WritingOptions} from 'xlsx';

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


  createWorkBook() {
    this.workbook = XLSX.utils.book_new();
    this.workbook.Workbook = {
      Views: [],
    };
  }


  addSheetToWorkbook(data: any[][], sheetName?: string, rtl: boolean = false) {

    if(!this.workbook)
      throw Error('Should create workbook first!');

    // Translate data and create new sheet
    XlsService.TranslateData(data);
    const sheet = XLSX.utils.aoa_to_sheet(data);

    const headers = data[0];

    // Set each column width as the width of header text length or the data text length (the widest)
    sheet['!cols'] = data[1].map((col, index)=>{return {
      wch: Math.max((''+col).length, headers[index].length, 10),
    }});

    // Set RTL
    this.workbook.Workbook.Views.push({RTL: rtl});

    // Append the sheet to the created workbook
    XLSX.utils.book_append_sheet(this.workbook, sheet, sheetName);

  }


  createFileFromWorkbook(downloadFile?: boolean, fileName?: string, title?: string, subject?: string) {

    // File format
    const bookType = 'xlsx';
    fileName = fileName + '.' + bookType;

    // File properties
    const options: WritingOptions = {
      type: downloadFile ? 'file' : 'base64',
      bookType: bookType,
      Props: {
        Author: this.authService.currentUser.displayName,
        CreatedDate: new Date(),
        Company: this.businessService.businessDoc.name,
        Title: title,
        Subject: subject,
      },
    };

    // Download as a file (using filename parameter) or create and return base64 format
    let base64;
    if(downloadFile)
      XLSX.writeFile(this.workbook, fileName, options);
    else
      base64 = XLSX.write(this.workbook, options);

    return base64;

  }


  createHTMLFromSheet(sheet : number | string = 0) : HTMLTableElement {

    // Get sheet name by its index
    if(typeof sheet == 'number')
      sheet = this.workbook.SheetNames[sheet];

    // Get sheet by its name
    const selectedSheet = this.workbook.Sheets[sheet];

    // Create HTML from the sheet
    const html = XLSX.utils.sheet_to_html(selectedSheet);

    // Configure table HTML for printing
    const el = document.createElement('div');
    el.innerHTML = html;
    const table = el.querySelector('table');
    table.dir = document.dir;
    el.querySelectorAll('td').forEach((td)=>{
      td.style.padding = '0 0.5em';
    });

    // Return the table element
    return table

  }


  static TranslateData(data: any[][]) {

    data.forEach((row, i)=>{
      row.forEach((cell, j)=>{

        // Numbers into formatted strings
        if(typeof cell == 'number')
          data[i][j] = formatNumber(cell, 'en-US', '1.0-3').replace(/,/g, '');

        // To date format that excel can read
        if(cell instanceof Date)
          data[i][j] = formatDate(cell, 'dd/MM/yyyy HH:mm:ss', 'en-US');

        // No data
        if(cell === undefined || cell === null)
          data[i][j] = '';

      });
    });

  }

}
