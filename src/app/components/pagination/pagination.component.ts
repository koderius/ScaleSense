import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';

@Component({
  selector: 'app-pagination',
  templateUrl: './pagination.component.html',
  styleUrls: ['./pagination.component.scss'],
})
export class PaginationComponent implements OnInit {

  readonly MAX_RESULTS_IN_QUERY = 10;

  page = 1;

  canGoForward: boolean;

  lastClicked: -1 | 0 | 1 = 0;

  @Output() onBack = new EventEmitter();
  @Output() onForward = new EventEmitter();

  _numOfResults: number;
  _totalNumOfResults: number;

  // If the total number of results is known
  @Input() set totalNumOfResults(num: number) {
    this._totalNumOfResults = num;
    this.canGoForward = this.page < Math.ceil(num / this.MAX_RESULTS_IN_QUERY);
  }

  @Input() set numOfResults(num: number) {

    // For new num of results (not after clicking), set as first page
    if(this.lastClicked === 0)
      this.page = 1;

    // If the total number of results is unknown, can go forward only if reached the maximum results per page
    if(!this._totalNumOfResults)
      this.canGoForward = (num == this.MAX_RESULTS_IN_QUERY);

    // If there are results, get them
    if(num) {

      this._numOfResults = num;

      // Change the page number, if it was after moving page (make sure page is not under 1)
      if(this.page + this.lastClicked > 0)
        this.page += this.lastClicked;

    }

    // If there are no results, and it was not when moving forward, set as first page with empty results
    else if(this.lastClicked != 1) {
      this._numOfResults = 0;
      this.page = 1;
    }

    // Reset last click
    this.lastClicked = 0;

    if(this._totalNumOfResults)
      this.canGoForward = this.page < Math.ceil(this._totalNumOfResults / this.MAX_RESULTS_IN_QUERY);

  }

  constructor() { }

  ngOnInit() {}

  nextClicked() {
    this.lastClicked = 1;
    this.onForward.emit();
  }

  previousClicked() {
    this.lastClicked = -1;
    this.onBack.emit();
  }

}
