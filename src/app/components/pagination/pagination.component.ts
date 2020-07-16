import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';

@Component({
  selector: 'app-pagination',
  templateUrl: './pagination.component.html',
  styleUrls: ['./pagination.component.scss'],
})
export class PaginationComponent implements OnInit {

  // Number of items per page
  @Input() itemsPerPage: number = 10;

  // The number of shown items
  private _numOfItems: number = 0;

  get numOfItems() : number {
    return this._numOfItems;
  }

  @Input() set numOfItems(num: number) {
    // Go back if no more results
    if(num === 0 && this.page > 1)
      this.previousClicked();
    else
      this._numOfItems = num;
  }

  // Total number of results, null if unknown
  @Input() totalNumOfItems: number | null;

  @Input() page: number = 1;

  @Output() onBack = new EventEmitter();
  @Output() onForward = new EventEmitter();


  get fromItem() : number {
    return (this.page - 1) * this.itemsPerPage + 1
  }

  get toItem() : number {
    return this.fromItem + this.numOfItems - 1;
  }

  get canGoBack() {
    return this.page > 1;
  }

  get canGoForward() {
    // For unknown number of results, can go forward only if the current results filled the page (equal to items per page)
    if(this.totalNumOfItems === null)
      return this.numOfItems == this.itemsPerPage;
    // For known number of results - as long as not reached the last result
    else
      return this.toItem < this.totalNumOfItems;
  }

  constructor() { }

  ngOnInit() {}

  nextClicked() {
    this.onForward.emit();
  }

  previousClicked() {
    this.onBack.emit();
  }

}
