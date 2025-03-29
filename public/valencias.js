import { main } from "./exam.js";
import { checkValencias } from "./question.js";

const valencias = [
  { atomo: "H", valencias: [-1, +1] },
  { atomo: "Li", valencias: [+1] },
  { atomo: "Na", valencias: [+1] },
  { atomo: "K", valencias: [+1] },
  { atomo: "Rb", valencias: [+1] },
  { atomo: "Cs", valencias: [+1] },
  { atomo: "Be", valencias: [+2] },
  { atomo: "Mg", valencias: [+2] },
  { atomo: "Ca", valencias: [+2] },
  { atomo: "Sr", valencias: [+2] },
  { atomo: "Ba", valencias: [+2] },
  { atomo: "Ra", valencias: [+2] },
  { atomo: "Ag", valencias: [+1] },
  { atomo: "Zn", valencias: [+2] },
  { atomo: "Cd", valencias: [+2] },
  { atomo: "Al", valencias: [+3] },
  { atomo: "Hg", valencias: [+1, 2] },
  { atomo: "Cu", valencias: [+1, 2] },
  { atomo: "Au", valencias: [+1, 3] },
  { atomo: "Fe", valencias: [+2, 3] },
  { atomo: "Co", valencias: [+2, 3] },
  { atomo: "Ni", valencias: [+2, 3] },
  { atomo: "Sn", valencias: [+2, 4] },
  { atomo: "Pb", valencias: [+2, 4] },
  { atomo: "Pt", valencias: [+2, 4] },
  { atomo: "Cr", valencias: [+3, 6] },
  { atomo: "Mn", valencias: [2, 4, 6, 7] },
  { atomo: "F", valencias: [-1] },
  { atomo: "Cl", valencias: [-1, 1, 3, 5, 7] },
  { atomo: "Br", valencias: [-1, 1, 3, 5, 7] },
  { atomo: "I", valencias: [-1, 1, 3, 5, 7] },
  { atomo: "O", valencias: [-2, -1] },
  { atomo: "S", valencias: [-2, 2, 4, 6] },
  { atomo: "Se", valencias: [-2, 2, 4, 6] },
  { atomo: "Te", valencias: [-2, 2, 4, 6] },
  { atomo: "N", valencias: [-3, 3, 5, 1, 2, 4] },
  { atomo: "P", valencias: [-3, 3, 5] },
  { atomo: "As", valencias: [-3, 3, 5] },
  { atomo: "Sb", valencias: [-3, 3, 5] },
  { atomo: "C", valencias: [-4, 2, 4] },
  { atomo: "Si", valencias: [-4, 4] },
  { atomo: "B", valencias: [-3, 3] },
  { atomo: "He", valencias: [0] },
  { atomo: "Ne", valencias: [0] },
  { atomo: "Ar", valencias: [0] },
  { atomo: "Kr", valencias: [0] },
  { atomo: "Xe", valencias: [0] },
  { atomo: "Rn", valencias: [0] },
];

const valenciasQuestions = valencias.map(({ atomo, valencias }) => ({
  question: atomo,
  type: "symbol",
  check: (val) => checkValencias(val, valencias),
  res: `La${valencias.length > 1 ? "s" : ""} valencia${
    valencias.length > 1 ? "s" : ""
  }  del ${atomo} ${valencias.length > 1 ? "son" : "es"} ${valencias
    .map((x) => (x > 0 ? `+${x}` : `${x}`))
    .join(", ")} (recuerda los signos)`,
}));

main(valenciasQuestions);
