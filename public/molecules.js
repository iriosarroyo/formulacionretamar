const getCharge = (molecule) => {
  if (!["[", "+", "-"].some((x) => molecule.includes(x))) return 0;
  const REGEX_CHARGE =
    /\[(?<ch1>[0-9]*)(?<sign1>(?:\+|-)?)(?<ch2>[0-9]*)\]|(?<sign2>\+|-)(?<ch3>[0-9]*)\s*$/;
  const match = molecule.match(REGEX_CHARGE);
  if (!match || !match.groups) return 0;
  const { ch1, ch2, ch3, sign1, sign2 } = match.groups;
  let chargeVal = "1";
  if (sign1 !== undefined) {
    if (ch1) chargeVal = ch1;
    if (ch2) chargeVal = ch2;
    return Number(`${sign1}${chargeVal}`);
  }
  if (ch3) chargeVal = ch3;
  return Number(`${sign2}${chargeVal}`);
};

const addOxidationNumbers = (molecule) => {
  const { atoms, charge } = molecule;
  const res = molecule; // We add oxNums in the following code
  if (atoms.length === 1) res.oxNums = [charge / atoms[0].num];
  res.oxNums = [];
  return res;
};

export const getAtomsOfMolec = (molecule, addDoubleAndTriple = false) => {
  const REGEX_ELEM =
    /(?<elem>[A-Z][a-z]?|e)(?<num>[0-9]*)|\((?<grp>.+?)\)(?<grpNum>[0-9]+)/g;
  const REGEX_ELEM_ADD =
    /(?<elem>[A-Z=≡][a-z]?|e)(?<num>[0-9]*)|\((?<grp>.+?)\)(?<grpNum>[0-9]+)/g;
  const matches = molecule.matchAll(
    addDoubleAndTriple ? REGEX_ELEM_ADD : REGEX_ELEM
  );
  let currMatch = matches.next();
  const result = {
    atoms: [],
    charge: getCharge(molecule),
  };
  while (!currMatch.done) {
    const { groups } = currMatch.value;
    if (!groups) throw Error("Expecting some groups"); // If it matches, it should always have gruops
    if (groups.grpNum !== undefined) {
      result.atoms.push({
        elem: groups.grp,
        num: Number(groups.grpNum),
        atoms: getAtomsOfMolec(groups.grp).atoms,
      });
    } else {
      result.atoms.push({
        elem: groups.elem,
        num: Math.max(Number(groups.num), 1),
      });
    }
    currMatch = matches.next();
  }
  if (molecule.includes("(ac)") || molecule.includes("(aq)"))
    result.state = "(aq)";
  return addOxidationNumbers(result);
};

export const getTotalAtoms = (atoms, result = {}, factor = 1) => {
  atoms.forEach(({ elem, num, atoms: grpAtoms }) => {
    if (elem === "e") return undefined;
    if (grpAtoms) return getTotalAtoms(grpAtoms, result, factor * num);
    // eslint-disable-next-line no-param-reassign
    result[elem] = (result[elem] ?? 0) + factor * num;
    return undefined;
  });
  return result;
};

export const isName = (str) => {
  if (str.length > 13) return true;
  if (str.includes("de")) return true;
  if (str.match(/[A-ZÁÓ][a-z]{2}/)) return true;
  return false;
};

export const detectTypeFromName = (name) => {
  name = name.trim();
  const [firstWord] = name.split(" ");
  if (
    (name.toLowerCase().includes("mang") ||
      name.toLowerCase().replace("ó", "o").includes("cro")) &&
    !name.includes("manganeso")
  )
    return "Excepciones del Mn y Cr";
  if (["Hidróxido", "Óxido", "Peróxido", "Hidruro", "Ion"].includes(firstWord))
    return firstWord + (firstWord === "Ion" ? "es" : "s");
  if (firstWord === "Ácido") {
    if (name.includes("hídrico")) return "Ácidos Hidrácidos";
    return "Ácidos Oxácidos";
  }
  if (firstWord.endsWith("uro")) {
    if (name.endsWith("hidrógeno")) return "Hidruros";
    if (firstWord.startsWith("Hidrógeno")) return "Sales Ácidas Binarias";
    return "Sales Binarias";
  }
  if (firstWord.endsWith("ato") || firstWord.endsWith("ito")) {
    if (firstWord.match(/^(di|tri)?hidrógeno/i)) return "Sales Ácidas";
    return "Sales Oxácidas";
  }
  return "Hidruros";
};
const ALCALINOS = ["H", "Li", "Na", "K", "Rb", "Cs", "Fr"];
const ALCALINOTERREOS = ["Be", "Mg", "Ca", "Sr", "Ba", "Ra"];
export const detectTypeFromMolecule = (molStr) => {
  const molecule = getAtomsOfMolec(molStr);
  const atoms = getTotalAtoms(molecule.atoms);
  const numElems = Object.keys(atoms).length;
  if (numElems === 4) return "Sales Ácidas";
  if (molecule.state === "(aq)") return "Ácidos Hidrácidos";
  if (molecule.charge && !(numElems > 1 && (atoms.Mn || atoms.Cr)))
    return "Iones";
  if (atoms.Mn || atoms.Cr) return "Excepciones del Mn y Cr";
  if (numElems === 3) {
    if (atoms.H && atoms.O) {
      if (molecule.atoms[0].elem === "H") return "Ácidos Oxácidos";
      return "Hidróxidos";
    }
    if (!atoms.O) return "Sales Ácidas Binarias";
    return "Sales Oxácidas";
  }
  if (numElems === 2) {
    if (atoms.H && !(atoms.O === 2 && atoms.H === 2)) return "Hidruros";
    else if (atoms.O) {
      if (
        ALCALINOS.concat(ALCALINOTERREOS).includes(molecule.atoms[0].elem) &&
        atoms.O === 2
      )
        return "Peróxidos";
      return "Óxidos";
    } else return "Sales Binarias";
  }
};
