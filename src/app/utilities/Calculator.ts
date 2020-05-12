import {ProductPublicDoc} from '../models/Product';

export class Calculator {

  /** Calc the expected net weight according to a given amount (the amount that is written in the order) */
  static ProductExpectedNetWeight(product: ProductPublicDoc, amount: number) : number {

    // If the product is measured by weight (type = 0), keep the weight.
    // If measured by some unit (type > 0), take the number of units multiply unit weight
    const bruto = product.type ? (product.unitWeight * amount) : amount;

    // If the box is included (no tara weight), keep the bruto.
    // If there is a tara, reduce it (multiply the number of units) TODO: What about products by weight? (no unit)
    return bruto - (product.tara || 0) * amount;

  }


  static CalcError(expected: number, real: number) : number {

    const gap = Math.abs(real - expected);
    return gap/expected;

  }


  /** Tolerance calculation */
  static IsTolerant(expected: number, real: number, tolerance: number | string) : boolean {

    // For value in '%', transform into real number ('34%' -> 0.34)
    if(typeof tolerance == 'string') {
      if(tolerance.slice(-1) == '%' && +tolerance.slice(0,-1))
        tolerance = (+tolerance.slice(0,-1)) / 100;

      // Invalid string value
      else
        return false;
    }

    // Rate smaller or equal to the tolerance = O.K.
    return Calculator.CalcError(expected, real) <= tolerance;

  }

}
