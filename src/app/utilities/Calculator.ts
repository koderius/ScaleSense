import {ProductOrder} from '../models/ProductI';

export class Calculator {

  /** Calc the expected net weight according to a given amount (the amount that is written in the order) */
  static ProductExpectedNetWeight(product: ProductOrder) : number {

    // If the product is measured by weight (type = 0), keep the weight.
    // If measured by some unit (type > 0), take the number of units multiply unit weight
    return product.amount * (product.type ? product.unitWeight : 1);

  }


  static CalcError(expected: number, real: number) : number {

    const gap = real - expected;

    // Ignore less than one gram differences
    if(Math.abs(gap) < 1e-3)
      return 0;

    return gap/expected;

  }


  /** Tolerance calculation */
  static IsTolerant(expected: number, real: number, tolerance: number | string) : boolean {

    if(!tolerance)
      tolerance = 0;

    // For value in '%', transform into real number ('34%' -> 0.34)
    if(typeof tolerance == 'string') {
      if(tolerance.slice(-1) == '%' && +tolerance.slice(0,-1))
        tolerance = (+tolerance.slice(0,-1)) / 100;

      // Invalid string value
      else
        return false;
    }

    // Rate (absolute) smaller or equal to the tolerance = O.K.
    return Math.abs(Calculator.CalcError(expected, real)) <= tolerance;

  }

}
