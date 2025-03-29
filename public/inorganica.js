import { main } from "./exam.js";
import { formInorganica } from "./formulacionInorganica.js";
import {
  detectTypeFromName,
  detectTypeFromMolecule,
  getAtomsOfMolec,
  isName,
} from "./molecules.js";

const suffixHTML = (num) => `<sub>${num}</sub>`;
const suffixWord = (num) => `<mn>${num}</mn>`;
const suffixStr = (num) => `${num}`;
const elemWord = (elem) => `<mi>${elem}</mi>`;

const elem = {
  word: elemWord,
  str: (elem) => elem,
};

const suffix = {
  HTML: suffixHTML,
  word: suffixWord,
  str: suffixStr,
};
const charge = {
  HTML: (charge) => `<sup>${charge}</sup>`,
  word: (charge) => `<msup><mn>${charge}}</mn></msup>`,
  str: (charge) => `[${charge}]`,
};

const charge2str = (charge) => {
  if (charge === 0) return "";
  if (Math.abs(charge) === 1) return charge > 0 ? "+" : "-";
  return charge > 0 ? `${charge}+` : `${Math.abs(charge)}-`;
};

const molecule2str = (molecule, mode) => {
  let res = "";
  const suffixFn = suffix[mode] ?? suffix.str;
  const chargeFn = charge[mode] ?? charge.str;
  const elemFn = elem[mode] ?? elem.str;
  for (const atom of molecule.atoms) {
    if (mode === "word") res += "<msub>";
    res += atom.atoms ? `(${molecule2str(atom, mode)})` : elemFn(atom.elem);
    if (atom.num > 1) res += suffixFn(atom.num);
    if (mode === "word") res += "</msub>";
  }

  if (molecule.charge !== undefined && molecule.charge !== 0) {
    res += chargeFn(charge2str(molecule.charge));
  }

  if (molecule.state) res += ` ${molecule.state}`;
  return res;
};

function deepEqual(elem1, elem2) {
  if (typeof elem1 !== typeof elem2) return false;
  if (typeof elem1 === "number" && Number.isNaN(elem1) && Number.isNaN(elem2))
    return true;
  if (typeof elem1 === "number" && (Number.isNaN(elem1) || Number.isNaN(elem2)))
    return false;
  if (typeof elem1 !== "object") return elem1 === elem2;
  if (elem1 === elem2) return true;
  if (elem1 === null || elem2 === null) return false;
  if (Array.isArray(elem1)) {
    if (!Array.isArray(elem2)) return false;
    if (elem1.length !== elem2.length) return false;
    for (let i = 0; i < elem1.length; i++) {
      if (!deepEqual(elem1[i], elem2[i])) return false;
    }
    return true;
  }
  const keysElem1 = Object.keys(elem1);
  const keysElem2 = Object.keys(elem2);
  if (keysElem1.length !== keysElem2.length) return false;
  for (let i = 0; i < keysElem1.length; i++) {
    if (!(keysElem1[i] in elem2)) return false;
    if (!deepEqual(elem1[keysElem1[i]], elem2[keysElem1[i]])) return false;
  }
  return true;
}

function capitalize(val) {
  return String(val).charAt(0).toUpperCase() + String(val).slice(1);
}

const inorganica = Object.fromEntries(
  Object.entries(formInorganica).map(([key, value]) => {
    return [
      key,
      value.flatMap(([name, molecule]) => {
        const molec = getAtomsOfMolec(molecule);
        return [
          {
            question: capitalize(name.replace(/orto/gi, "")),
            type: "name",
            res: molecule2str(molec, "HTML"),
            check: (answer) =>
              deepEqual(
                molec,
                getAtomsOfMolec(answer.trim().normalize().replace(/\s/g, ""))
              ),
          },
          {
            question: molecule2str(molec, "HTML"),
            res: name.replace(/orto/gi, "(orto)"),
            type: "symbol",
            check: (answer) =>
              !answer
                .replace(/iod/gi, "yod")
                .replace(/cinc/gi, "zinc")
                .replace(/orto/gi, "")
                .localeCompare(
                  name.replace(/orto/gi, "").replace(/cinc/gi, "zinc"),
                  "es",
                  {
                    sensitivity: "base",
                    ignorePunctuation: true,
                  }
                ),
          },
        ];
      }),
    ];
  })
);

main(inorganica, true);
