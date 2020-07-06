import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {ProductPublicDoc} from '../../models/ProductI';
import {UnitAmountPipe} from '../../pipes/unit-amount.pipe';
import {Platform, ToastController} from '@ionic/angular';

@Component({
  selector: 'app-product-to-cart',
  templateUrl: './product-to-cart.component.html',
  styleUrls: ['./product-to-cart.component.scss'],
  providers: [UnitAmountPipe]
})
export class ProductToCartComponent implements OnInit {

  private _amount = 0;

  @Input() product: ProductPublicDoc;
  @Output() addToCart = new EventEmitter();

  constructor(
    private unitPipe: UnitAmountPipe,
    private platform: Platform,
    private toastCtrl: ToastController,
  ) { }

  ngOnInit() {
  }

  get isMobile() {
    return !this.platform.is('desktop');
  }

  get amount() : number {
    return this._amount || 0;
  }

  @Input() set amount(amount: number) {
    if(!amount || amount <= 0)
      amount = 0;
    this._amount = amount;
    this.addToCart.emit(this.amount);
  }


  inputValue() {
    return this.unitPipe.transform(this._amount, this.product.type);
  }

  onInputChange(ev) {
    this.amount = +ev.target.value.split(' ')[0];
  }


  async popInfo() {
    if(this.isMobile) {
      const t = await this.toastCtrl.create({
        message: this.product.description || 'לא קיים תיאור',
        duration: 3000,
      });
      t.present();
    }
  }

}
