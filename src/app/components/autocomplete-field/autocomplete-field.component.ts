import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';

@Component({
  selector: 'app-autocomplete-field',
  templateUrl: './autocomplete-field.component.html',
  styleUrls: ['./autocomplete-field.component.scss'],
})
export class AutocompleteFieldComponent implements OnInit {

  // The full list of objects
  @Input() list: any[] = [];
  // The property of an object to be displayed in the list
  @Input() displayProp: string;
  // The property of an object to be used as the value returned on selection
  @Input() valueProp: string;
  // Input's placeholder and label
  @Input() placeholder: string;
  @Input() label: string;
  // Selected value on init
  @Input() selected: string;

  @Input() allowFreeText: boolean;

  // On selection of an option - returns the value property
  @Output() onSelect = new EventEmitter();
  // On typing in the input field - returns the text value
  @Output() onQueryChange = new EventEmitter();

  // Text query in the input field
  query: string = '';


  // The filtered list to be shown
  get filteredList() {
    return this.list.filter((item)=>(item[this.displayProp] as string).startsWith(this.query));
  }

  constructor() {}

  // Select the item of the selected value
  ngOnInit(): void {
    const item = this.list.find((item)=>item[this.valueProp] == this.selected);
    this.query = item ? item[this.displayProp] : '';
  }

  // In case the query is equal to one of the options (would be the first one after filtering), make sure to pick it when the menu is closed
  onClosed() {
    const firstOption = this.filteredList[0];
    if(firstOption && this.query == firstOption[this.displayProp]) {
      this.query = firstOption[this.displayProp];
      this.onSelect.emit(firstOption[this.valueProp]);
    }
    else
      // For empty query, or the query does not match any option (when free text is not allowed), emit with null value
      if(!this.query || !this.allowFreeText) {
        this.query = '';
        this.onSelect.emit(null);
      }


  }

}
