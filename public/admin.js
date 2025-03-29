import { utils, writeFile } from "./xlsx.mjs";
import { emailToCurso, isAdmin } from "./tools.js";
import { allUsers } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js";
import { auth, onStats } from "./firebase.js";
import { formCompounds, getStatsFromExams } from "./stats.js";

const usersToWorksheet = (users) => {
  return utils.aoa_to_sheet(
    [
      [
        "Email",
        "Nombre",
        "Curso",
        "Valencias: Número de Exámenes",
        "Valencias: Número de Preguntas",
        "Valencias: Número de Correctas",
        "Valencias: Proporción Correctas",
        "Inorgánica: Número de Exámenes",
        "Inorgánica: Número de Preguntas",
        "Inorgánica: Número de Correctas",
        "Inorgánica: Proporción Correctas",
        ...formCompounds,
      ],
    ].concat(
      users.map(({ email, username, stats = {}, exams = {} }) => {
        const { valencias = {}, inorganica = {} } = stats;
        const { numCorr = 0, numExam = 0, numPregs = 0 } = valencias;
        const { numCorr: c = 0, numExam: e = 0, numPregs: p = 0 } = inorganica;
        return [
          email,
          username,
          emailToCurso(email),
          numExam,
          numPregs,
          numCorr,
          numCorr / (numPregs || 1),
          e,
          p,
          c,
          c / (p || 1),
          ...getStatsFromExams(exams),
        ];
      })
    )
  );
};

const saveDBUserData = async () => {
  const users = await allUsers();
  const workbook = utils.book_new();
  const ws = usersToWorksheet(Object.values(users ?? {}));
  utils.book_append_sheet(workbook, ws, "Hoja 1");
  writeFile(workbook, "FormulacionRetamarUsuarios.xlsx");
};

let abortControl;
onAuthStateChanged(auth, async (user) => {
  let endListeners = [];
  if (user && isAdmin(user.email)) {
    abortControl = new AbortController();
    endListeners = [
      onStats(`globalStats/valencias`, "ValGlobal"),
      onStats(`globalStats/inorganica`, "InorGlobal"),
    ];
    document
      .querySelector("#download")
      ?.addEventListener("click", saveDBUserData, {
        signal: abortControl.signal,
      });
  } else {
    abortControl?.abort();
    endListeners.forEach((fn) => fn());
  }
});
