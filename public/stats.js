import { formInorganica } from "./formulacionInorganica.js";
import {
  detectTypeFromMolecule,
  detectTypeFromName,
  isName,
} from "./molecules.js";

export const formCompounds = Object.keys(formInorganica);

const getTypeOfCompounds = (enunciados) => {
  return enunciados
    .split(";")
    .filter((x) => !x.match(/^[A-Z][a-z]?$/))
    .reduce((acc, curr) => {
      const fn = isName(curr) ? detectTypeFromName : detectTypeFromMolecule;
      const type = fn(curr);
      acc[type] = (acc[type] ?? 0) + 1;
      return acc;
    }, {});
};
const rmScripts = (str) => {
  str = str.replace(/<\/?sub>/g, "");
  str = str.replace(/<sup>/g, "[");
  str = str.replace(/<\/sup>/g, "]");
  return str;
};
export const getStatsFromExams = (exams) => {
  const values = Object.values(exams);
  if (values.length === 0) return formCompounds.map(() => 0);
  const str = rmScripts(
    values.reduce(
      (acc, curr, i) =>
        i === 0 ? curr.enunciados : `${acc};${curr.enunciados}`,
      ""
    )
  );

  const types = getTypeOfCompounds(str);
  return formCompounds.map((x) => types[x] ?? 0);
};
