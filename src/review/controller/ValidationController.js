// ValidationController.js
import * as validationRules from '../rules/validationRules.js';
import * as ReviewController from './ReviewController.js';

export function runPreflight() {
  const claim = ReviewController.getClaim();
  const workingInvoices = ReviewController.getWorkingInvoices();
  return validationRules.runPreflight(claim, workingInvoices);
}

export function registerValidator(fn) {
  validationRules.register(fn);
}

export default { runPreflight, registerValidator };
