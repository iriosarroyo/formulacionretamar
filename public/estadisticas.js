import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js";
import { auth, onExamsFromUser, onStats } from "./firebase.js";
import { formCompounds, getStatsFromExams } from "./stats.js";

const createPlotFromExams = (exams) => {
  const stats = getStatsFromExams(exams);
  const data = [
    {
      x: formCompounds,
      y: stats,
      text: stats,
      textposition: "auto",
      hoverinfo: "none",
      type: "bar",
    },
  ];

  Plotly.newPlot("typesPlot", data, {
    title: { text: "Tipos de Compuestos en los Exámenes" },
    yaxis: {
      title: { text: "Nº de Compuestos" },
    },
    width: document.querySelector("#typesPlot").getBoundingClientRect().width,
  });
};

onAuthStateChanged(auth, async (user) => {
  let endListeners = [];
  if (user) {
    document.querySelector("#user").innerText = "Usuario: " + user.displayName;
    endListeners = [
      onStats(`users/${user.uid}/stats/valencias`, "ValUser"),
      onStats(`users/${user.uid}/stats/inorganica`, "InorUser"),
      onStats(`globalStats/valencias`, "ValGlobal"),
      onStats(`globalStats/inorganica`, "InorGlobal"),
      onExamsFromUser(user.uid, (exams) => {
        createPlotFromExams(exams);
      }),
    ];
  } else {
    document.querySelector("#user").innerText = "";
    endListeners.forEach((fn) => fn());
  }
});
