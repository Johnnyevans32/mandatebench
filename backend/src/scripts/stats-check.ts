/* eslint-disable no-console */
import {
  auc,
  bootstrapCI,
  cohenKappa,
  logisticFit,
  mean,
  pearson,
  ranks,
  spearman,
} from '../analysis/stats';

/**
 * Sanity checks for the in-stack statistics against hand-computable reference
 * values. Run: npx ts-node src/scripts/stats-check.ts
 */
let failures = 0;
function check(name: string, actual: number, expected: number, tol = 1e-6) {
  const ok = Math.abs(actual - expected) <= tol;
  if (!ok) failures++;
  console.log(
    `${ok ? 'OK  ' : 'FAIL'} ${name}: got ${actual.toFixed(6)}, expected ${expected.toFixed(6)}`,
  );
}

// ranks with ties: [10,20,20,40] -> [1, 2.5, 2.5, 4]
const r = ranks([10, 20, 20, 40]);
check('ranks tie[1]', r[1], 2.5);
check('ranks tie[2]', r[2], 2.5);

// pearson perfect positive / spearman monotonic
check('pearson perfect', pearson([1, 2, 3, 4, 5], [2, 4, 6, 8, 10]), 1);
check('spearman monotonic', spearman([1, 2, 3, 4], [1, 8, 27, 64]), 1);
check('spearman reversed', spearman([1, 2, 3, 4], [4, 3, 2, 1]), -1);

// cohen's kappa: a=[1,1,0,0], b=[1,0,1,0] -> po=0.5, pe=0.5, k=0
check('cohenKappa zero', cohenKappa([1, 1, 0, 0], [1, 0, 1, 0]), 0);
// perfect agreement -> 1
check('cohenKappa perfect', cohenKappa([1, 0, 1, 0], [1, 0, 1, 0]), 1);

// AUC: perfectly separable -> 1, reversed -> 0
check('auc perfect', auc([0.9, 0.8, 0.3, 0.2], [true, true, false, false]), 1);
check('auc reversed', auc([0.2, 0.3, 0.8, 0.9], [true, true, false, false]), 0);
// AUC with a tie across classes: scores [1,1] labels [T,F] -> 0.5
check('auc tie', auc([1, 1, 0, 0], [true, false, true, false]), 0.5);

// bootstrap CI of the mean of a constant sample collapses to the constant
const bc = bootstrapCI([5, 5, 5, 5], (s) => mean(s), { iters: 200, seed: 1 });
check('bootstrap const estimate', bc.estimate, 5);
check('bootstrap const low', bc.low, 5);
check('bootstrap const high', bc.high, 5);

// logistic: clearly separable data -> positive slope, sign is what matters
const lf = logisticFit([0, 1, 2, 3, 4, 5, 6, 7], [0, 0, 0, 0, 1, 1, 1, 1], {
  iters: 4000,
});
console.log(
  `${lf.b1 > 0 ? 'OK  ' : 'FAIL'} logistic slope positive: b1=${lf.b1.toFixed(4)} b0=${lf.b0.toFixed(4)}`,
);
if (!(lf.b1 > 0)) failures++;

console.log(`\n${failures === 0 ? 'ALL PASS' : `${failures} FAILURE(S)`}`);
process.exit(failures === 0 ? 0 : 1);
