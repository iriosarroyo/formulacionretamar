import { getAtomsOfMolec } from "./molecules.js";
import { pickRandom, rdnBetween, rndBin } from "./random.js";
import { charge2str } from "./tools.js";

const gruposFuncionales = {
  alcohol: { n: 1, terminacion: "ol", grupo: "OH" },
  aldehido: { n: 3, terminacion: "al", grupo: "HO", reverseFirst: true },
  cetona: { n: 2, terminacion: "ona", grupo: "O" },
  acidoCarboxilico: {
    n: 3,
    terminacion: "oico",
    grupo: "OOH",
    reverseFirst: true,
    reverseComplete: true,
  },
  ester: { n: 3, terminacion: "oato", grupo: "OO", reverseComplete: true },
  ion: { n: 3, terminacion: "oato", grupo: "OO[-]", reverseComplete: true },
  eter: { n: 0, terminacion: "éter", grupo: "-O-" },
  //   amina: 1,
  //   amida: 1,
};

const MAX_TRIES = 100;
const genDoubleOrTripleBonds = (
  n,
  hidrogens,
  consumes,
  forceStart,
  prob = 0.1
) => {
  const bonds = [];
  let rdn = Math.random();
  while (rdn < prob && bonds.length < n) {
    for (let i = 0; i < MAX_TRIES; i++) {
      const idx = rdnBetween(1, n - 1);
      if (forceStart) {
        if (bonds.length === 0 && idx > Math.floor(n / 2)) continue;
        if (
          bonds.length > 0 &&
          idx > Math.floor(n / 2) &&
          bonds.every((x) => x > n - idx)
        )
          continue;
      }
      if (bonds.includes(idx)) continue;
      if (hidrogens[idx - 1] < consumes || hidrogens[idx] < consumes) continue;
      hidrogens[idx - 1] -= consumes;
      hidrogens[idx] -= consumes;
      bonds.push(idx);
      break;
    }
    rdn = Math.random();
  }
  bonds.sort();
  return bonds;
};

const genGrupo = (
  n,
  hidrogens,
  consumes,
  forceStart,
  forbiddenIdx,
  prob = 0.1
) => {
  const grupo = [];
  let rdn = 0;
  while (rdn < prob) {
    for (let i = 0; i < MAX_TRIES; i++) {
      const idx = rdnBetween(1, n);
      if (forceStart) {
        if (grupo.length === 0 && idx > Math.floor((n + 1) / 2)) continue;
        if (
          grupo.length > 0 &&
          idx > Math.floor((n + 1) / 2) &&
          grupo.every((x) => x > n - idx + 1)
        )
          continue;
      }
      if (forbiddenIdx.includes(idx)) continue;
      if (hidrogens[idx - 1] < consumes) continue;
      hidrogens[idx - 1] -= consumes;
      grupo.push(idx);
      break;
    }
    rdn = Math.random();
  }
  grupo.sort();
  return grupo;
};
const raiz = [
  "met",
  "et",
  "prop",
  "but",
  "pent",
  "hex",
  "hept",
  "oct",
  "non",
  "dec",
];
const genRamificacion = (n, hidrogens, consumes, forceStart, prob = 0.5) => {
  const rams = [];
  let rdn = Math.random();
  let sum = hidrogens.reduce((acum, curr) => acum + curr);
  let total = 0;
  while (rdn < prob && sum !== 0 && total < MAX_TRIES * 4) {
    for (let i = 0; i < MAX_TRIES; i++) {
      total += 1;
      const idx = rdnBetween(2, n - 1);
      if (forceStart) {
        if (rams.length === 0 && idx > Math.floor((n + 1) / 2)) continue;
        if (
          rams.length > 0 &&
          idx > Math.floor((n + 1) / 2) &&
          rams.every((x) => x > n - idx + 1)
        )
          continue;
      }
      if (hidrogens[idx - 1] < consumes) continue;
      hidrogens[idx - 1] -= consumes;
      sum -= consumes;
      // Ramifications can't be longer than the chain itself
      // Limit to 4 carbons (butilo)
      const length = Math.min(rdnBetween(1, Math.min(idx - 1, n - idx)), 4);
      rams.push({ pos: idx, length });
      break;
    }
    rdn = Math.random();
  }
  rams.sort(({ length, pos }, { length: len2, pos: pos2 }) => {
    const raiz1 = raiz[length - 1];
    const raiz2 = raiz[len2 - 1];
    const compare = raiz1.localeCompare(raiz2);
    if (compare === 0) return pos - pos2;
    return compare;
  });
  return rams;
};
const createCompound = () => {
  const cadenaPrincipal = rndBin(9, 0.45) + 1;
  const cadenaSecundaria = rndBin(9, 0.45) + 1;

  const hidrogenos = Array(cadenaPrincipal)
    .fill(2)
    .map((x, i) => (i === 0 || i === cadenaPrincipal - 1 ? 3 : x));

  if (cadenaPrincipal === 1) hidrogenos[0] = 4;

  const listaFunciones = Object.keys(gruposFuncionales);
  if (cadenaPrincipal <= 2)
    listaFunciones.splice(listaFunciones.indexOf("cetona"), 1);

  const grupoFuncional = pickRandom(listaFunciones);
  const isThereGroup = Math.random() < 0.7;
  let grupo = [],
    hidroxis = [];
  if (isThereGroup) {
    if (grupoFuncional === "eter")
      return {
        cadenaPrincipal,
        hidrogenos,
        grupo: [],
        doubleBonds: [],
        tripleBonds: [],
        cadenaSecundaria,
        grupoFuncional,
        hidroxis: [],
        ramificaciones: [],
      };
    let forbiddenIdxs = [];
    if (grupoFuncional === "cetona") forbiddenIdxs = [1, cadenaPrincipal];
    if (grupoFuncional === "ester" || grupoFuncional === "ion")
      forbiddenIdxs = cadenaPrincipal === 1 ? [] : [cadenaPrincipal];

    grupo = genGrupo(
      cadenaPrincipal,
      hidrogenos,
      gruposFuncionales[grupoFuncional].n,
      true,
      forbiddenIdxs
    );
    if (grupoFuncional === "acidoCarboxilico")
      hidroxis = genGrupo(cadenaPrincipal, hidrogenos, 1, false, []);
  }

  const doubleBonds = genDoubleOrTripleBonds(
    cadenaPrincipal,
    hidrogenos,
    1,
    !isThereGroup
  );
  const tripleBonds = genDoubleOrTripleBonds(
    cadenaPrincipal,
    hidrogenos,
    2,
    !isThereGroup && doubleBonds.length === 0
  );

  // ramificaciones
  const ramificaciones = genRamificacion(
    cadenaPrincipal,
    hidrogenos,
    1,
    !isThereGroup && doubleBonds.length === 0 && tripleBonds.length === 0,
    1
  );
  return {
    cadenaPrincipal,
    hidrogenos,
    grupo,
    doubleBonds,
    tripleBonds,
    cadenaSecundaria,
    grupoFuncional:
      isThereGroup && grupo.length > 0 ? grupoFuncional : undefined,
    hidroxis,
    ramificaciones,
  };
};

const reps = [
  "",
  "di",
  "tri",
  "tetra",
  "penta",
  "hexa",
  "hepta",
  "octa",
  "nona",
  "deca",
];

const nombreCompuesto = (compound) => {
  const {
    cadenaPrincipal,
    cadenaSecundaria,
    grupoFuncional,
    grupo,
    doubleBonds,
    tripleBonds,
    hidroxis,
    ramificaciones,
  } = compound;
  if (grupoFuncional === "eter") {
    const cadenas = [raiz[cadenaPrincipal - 1], raiz[cadenaSecundaria - 1]];
    cadenas.sort();
    return cadenas.map((x) => x + "il").join("") + "éter";
  }
  let nombre = "";
  if (ramificaciones?.length) {
    const ramsAndOH = ramificaciones.concat(
      hidroxis?.map((x) => ({ pos: x, length: "OH" })) ?? []
    );
    const ramGroups = Object.groupBy(ramsAndOH, ({ length }) => length);
    Object.entries(ramGroups)
      .toSorted(([, a], [, b]) => {
        const { length: lenA } = a[0];
        const { length: lenB } = b[0];
        const rootA = lenA === "OH" ? "hidroxi" : raiz[lenA - 1];
        const rootB = lenB === "OH" ? "hidroxi" : raiz[lenB - 1];
        return rootA.localeCompare(rootB);
      })
      .forEach(([length, group]) => {
        if (nombre) nombre += "-";
        const positions = group.map(({ pos }) => pos).join(",");
        const prefix = reps[group.length - 1];
        const root =
          length === "OH" ? "hidroxi" : `${raiz[parseInt(length) - 1]}il`;
        nombre += `${positions}-${prefix}${root}`;
      });
  }
  // if (hidroxis?.length) {
  //   if (nombre) nombre += "-";
  //   nombre += `${hidroxis.join(",")}-${reps[hidroxis.length - 1]}hidroxi`;
  // }
  nombre += raiz[cadenaPrincipal - 1];
  if (tripleBonds?.length) {
    nombre += `-${tripleBonds.join(",")}-${reps[tripleBonds.length - 1]}in`;
  }
  if (doubleBonds?.length) {
    nombre += `-${doubleBonds.join(",")}-${reps[doubleBonds.length - 1]}en`;
  }
  if (!tripleBonds?.length && !doubleBonds?.length) nombre += "an";
  if (grupoFuncional) {
    const { terminacion, n } = gruposFuncionales[grupoFuncional];
    if (n !== 3 && !(n === 2 && cadenaPrincipal <= 3))
      nombre += `-${grupo.join(",")}-`;
    nombre += `${reps[grupo.length - 1]}${terminacion}`;
  } else {
    nombre += "o";
  }
  if (grupoFuncional === "acidoCarboxilico") nombre = `Ácido ${nombre}`;
  else if (grupoFuncional === "ion") nombre = `Ion ${nombre}`;
  else if (grupoFuncional === "ester")
    nombre += ` de ${raiz[cadenaSecundaria - 1]}ilo`;
  return nombre;
};

const fullRamificacion = (n, start = true) => {
  return Array(n)
    .fill(2)
    .map((_, i) =>
      (i === 0 && start) || (i + 1 === n && !start) ? `CH3` : `CH2`
    )
    .join("");
};

const formulaCompuesto = (compound) => {
  const {
    cadenaPrincipal,
    cadenaSecundaria,
    grupoFuncional,
    hidrogenos,
    grupo,
    doubleBonds,
    tripleBonds,
    hidroxis,
    ramificaciones,
  } = compound;
  if (grupoFuncional === "eter") {
    return `${fullRamificacion(cadenaPrincipal)}-O-${fullRamificacion(
      cadenaSecundaria,
      false
    )}`;
  }
  const comp = Array(cadenaPrincipal).fill("C");
  hidrogenos.forEach((x, i) => {
    if (x === 0) return;
    if (x === 1) return (comp[i] += "H");
    comp[i] += `H${x}`;
  });
  const ramGroups = Object.values(
    Object.groupBy(ramificaciones, ({ length, pos }) => `${length}_${pos}`)
  );
  ramGroups.sort((a, b) => a[0].length - b[0].length);
  ramGroups.forEach((group) => {
    if (group.length === 1)
      comp[group[0].pos - 1] += `(${fullRamificacion(group[0].length, false)})`;
    else
      comp[group[0].pos - 1] += `(${fullRamificacion(group[0].length, false)})${
        group.length
      }`;
  });
  grupo.forEach(
    (x) => (comp[x - 1] += `${gruposFuncionales[grupoFuncional].grupo}`)
  );
  hidroxis.forEach(
    (x) => (comp[x - 1] += `${gruposFuncionales["alcohol"].grupo}`)
  );
  doubleBonds.forEach((x) => (comp[x - 1] += `=`));
  tripleBonds.forEach((x) => (comp[x - 1] += `≡`));
  let nToReverse = 1;
  if (
    gruposFuncionales[grupoFuncional]?.reverseComplete ||
    Math.random() < 0.5
  ) {
    comp.reverse();
    nToReverse = cadenaPrincipal;
  }
  if (
    gruposFuncionales[grupoFuncional]?.reverseFirst &&
    grupo?.includes(nToReverse) &&
    cadenaPrincipal !== 1
  )
    comp[0] = comp[0].split("").toReversed().join("");

  if (grupoFuncional === "ester")
    comp[cadenaPrincipal - 1] += fullRamificacion(cadenaSecundaria, false);

  return comp.join("");
};

const LETTER_WIDTH = 20;
const LETTER_HEIGHT = 20;
/**
 *
 * @param {string} formula
 * @param {HTMLCanvasElement} canvas
 */
const drawMolecule = (formula, canvas) => {
  const atoms = getAtomsOfMolec(formula, true);
  const { atoms: atomList, charge } = atoms;
  const points = [];
  let x = -1;
  let jumpNextH = false;
  let defaultY = 0;
  atomList.forEach(({ elem, num, atoms: atomsGroup }, i) => {
    console.log(elem, atomsGroup);
    if (atomsGroup) return;
    if (elem === "C") {
      if (points.length && !["-", "=", "≡"].includes(points.at(-1).text))
        points.push({ y: defaultY, x: ++x, text: "-" });
      points.push({ y: defaultY, x: ++x, text: elem });
    } else if (elem === "O") {
      if (i === 0) {
        points.push({ y: defaultY - 1, x: ++x, text: elem });
        points.push({ y: defaultY + 1, x, text: "H" });
        jumpNextH = true;
        points.push({ y: defaultY - 0.5, x: ++x, text: "=", rotation: 45 });
        points.push({ y: defaultY + 0.5, x, text: "-", rotation: -45 });
      } else if (
        atomList.at(i - 1)?.elem === "O" &&
        atomList.at(i + 1)?.elem === "C"
      ) {
        points.push({ y: defaultY, x: ++x, text: elem });
      } else if (["C", "O"].includes(atomList.at(i + 1)?.elem)) {
        points.push({ y: defaultY - 2, x, text: elem });
        points.push({ y: defaultY - 1, x, text: "=", rotation: 90 });
      } else if (atomList.at(i + 1)?.elem === "H") {
        jumpNextH = true;
        points.push({ y: defaultY + 1, x, text: "-", rotation: 90 });
        points.push({ y: defaultY + 2, x, text: elem });
        points.push({ y: defaultY + 2, x: x + 1, text: "H" });
      } else {
        points.push({ y: defaultY, x: ++x, text: elem });
      }
    } else if (elem === "H") {
      if (jumpNextH) return (jumpNextH = false);
      if (atomList.at(i + 1)?.elem === "O") return;
      points.push({
        y: defaultY,
        x: ++x,
        text: elem,
        subindex: num <= 1 ? undefined : num,
      });
    } else points.push({ y: defaultY, x: ++x, text: elem });
  });

  if (charge) {
    points.push({
      y: defaultY,
      x,
      text: "",
      superindex: charge2str(charge),
    });
  }

  const ys = points.map(({ y }) => y);
  const minY = Math.min(...ys) - 1.5;
  const maxY = Math.max(...ys);
  const xs = points.map(({ x }) => x);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const ctx = canvas.getContext("2d");
  ctx.font = "20px Arial";
  const formulaWidth = ctx.measureText(formula).width;
  const width = Math.max((maxX - minX + 2) * LETTER_WIDTH, formulaWidth);
  const height = (maxY - minY + 2) * LETTER_HEIGHT;
  canvas.width = width;
  canvas.height = height;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "20px Arial";

  points.forEach(({ x, y, text, subindex, superindex, rotation }, i) => {
    ctx.save();
    ctx.translate((x + 0.5 - minX) * LETTER_WIDTH, (y - minY) * LETTER_HEIGHT);
    if (rotation) ctx.rotate((rotation * Math.PI) / 180);
    ctx.fillText(text, 0, 0);
    ctx.restore();
    ctx.strokeStyle = `hsl(${(120 * i) % 360}deg, 100%, 50%)`;
    // ctx.beginPath();
    // ctx.rect(
    //   (x - minX) * LETTER_WIDTH,
    //   (y - minY - 0.5) * LETTER_HEIGHT,
    //   LETTER_WIDTH,
    //   LETTER_HEIGHT
    // );
    // ctx.stroke();
    if (subindex || superindex) {
      ctx.font = "10px Arial";
      ctx.textBaseline = subindex ? "hanging" : "ideographic";
      ctx.fillText(
        subindex ?? superindex,
        (x - minX) * LETTER_WIDTH + 20,
        (y - minY) * LETTER_HEIGHT
      );
      ctx.textBaseline = "middle";
      ctx.font = "20px Arial";
    }
  });
  ctx.fillText(formula, canvas.width / 2, LETTER_HEIGHT * 0.5);
};

console.log(
  Array(10)
    .fill(0)
    .map(() => {
      const canvas = document.createElement("canvas");
      document.body.append(canvas);
      const comp = createCompound();
      const form = formulaCompuesto(comp);
      drawMolecule(form, canvas);
      return [comp, nombreCompuesto(comp), form, getAtomsOfMolec(form)];
    })
);
