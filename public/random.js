const NUM_OF_TRIES = 100;
const alreadyPicked = new Set();

// Be careful, assumes there is no second argument in future uses
export const pickRandom = (arr) => {
  return arr[Math.floor(Math.random() * arr.length)];
};

const pickRandomWeighted = (arr, weights) => {
  const totalWeight = weights.reduce((acc, w) => acc + w, 0);
  const rdn = Math.random() * totalWeight;
  let acc = 0;
  for (let i = 0; i < arr.length; i++) {
    acc += weights[i];
    if (rdn < acc) return arr[i];
  }
  return arr[arr.length - 1];
};

const pickModifyingWeight = (arr, weights) => {
  const rdn = pickRandomWeighted(arr, weights);
  const idx = arr.indexOf(rdn);
  weights[idx] = 1 / (1 / weights[idx] + 1);
  return rdn;
};

export const pickRandomNoRep = (arr) => {
  for (let i = 0; i < NUM_OF_TRIES; i++) {
    let rdn = pickRandom(arr);
    if (!alreadyPicked.has(rdn)) {
      alreadyPicked.add(rdn);
      return rdn;
    }
  }
  return null;
};

export const reset = () => {
  alreadyPicked.clear();
};

export const pickFromSelection = (
  n,
  dict,
  selection,
  types,
  weighted = true
) => {
  reset();
  if (!selection.every((el) => el in dict)) throw Error("Invalid selection");
  let weights = Array(selection.length).fill(1);
  const picker = weighted ? pickModifyingWeight : pickRandom;
  return Array(n)
    .fill(0)
    .map(() => {
      let result = undefined,
        prevDefinedResult = undefined;
      for (let i = 0; i < NUM_OF_TRIES; i++) {
        if (result) prevDefinedResult = result;
        const pickedKey = picker(selection, weights);
        result = pickRandomNoRep(dict[pickedKey]);
        if (!result) continue;
        if (!types) break;
        if (types[result.type] < n / 2) {
          types[result.type]++;
          break;
        }
      }
      if (!result) result = prevDefinedResult;
      return result;
    });
};

export const rdnBetween = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1) + min);
};

const factorial = (n) => {
  let total = 1;
  for (let i = 1; i <= n; i++) total *= i;
  return total;
};

const binomialFreq = (n, p) => {
  const nFactorial = factorial(n);
  return Array(n + 1)
    .fill(0)
    .map(
      (_, i) =>
        (nFactorial / (factorial(i) * factorial(n - i))) *
        p ** i *
        (1 - p) ** (n - i)
    );
};

export const rndBin = (n, p) => {
  const weights = binomialFreq(n, p);
  const numbers = Array(n + 1)
    .fill(0)
    .map((_, i) => i);
  return pickRandomWeighted(numbers, weights);
};

// const counter = {};
// const n = 1000;
// const dict = Object.fromEntries(
//   Array(10)
//     .fill(0)
//     .map((_, i) => [
//       i,
//       Array(n)
//         .fill(0)
//         .map((_, j) => i * n + j),
//     ])
// );

// const selection = Object.keys(dict);
// const picks = pickFromSelection(200, dict, selection, true);
// picks.forEach((pick) => {
//   pick = Math.floor(pick / n);
//   if (counter[pick]) counter[pick]++;
//   else counter[pick] = 1;
// });
// console.log(counter);

// const counter2 = {};
// const picks2 = pickFromSelection(200, dict, selection, false);
// picks2.forEach((pick) => {
//   pick = Math.floor(pick / n);
//   if (counter2[pick]) counter2[pick]++;
//   else counter2[pick] = 1;
// });
// console.log(counter2);
