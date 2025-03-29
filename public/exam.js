import { copyQuestions } from "./copy.js";
import { auth, sendExamToDB, updateGlobalAndUserStats } from "./firebase.js";
import { checkValencias, examGen } from "./question.js";
import { createTimer, formatTime } from "./timer.js";
import { disableInput, emailToCurso } from "./tools.js";

const configElem = document.querySelector("#config");
/**
 * @type {HTMLFormElement}
 */
const examElem = document.querySelector("#exam");
const timePerQuestionElem = document.querySelector("#timePerQuestion");
const totalTimeElem = document.querySelector("#totalTime");
/**
 * @type {HTMLInputElement}
 */
const questionsElem = document.querySelector("#questionsNumber");

const translation = {
  oxidos: "Óxidos",
  hidruros: "Hidruros",
  hidracidos: "Ácidos Hidrácidos",
};

const createCheckboxes = (questions) => {
  const sel = document.querySelector("#seleccion");
  Object.keys(questions).forEach((x) => {
    const label = document.createElement("label");
    label.classList.add("switch");
    label.htmlFor = x;
    const input = document.createElement("input");
    input.classList.add("hidden");
    input.id = x;
    input.type = "checkbox";
    input.name = "selection";
    if (emailToCurso(auth.currentUser?.email) === "2º bach") {
      disableInput(input);
    }
    const i1 = document.createElement("i");
    i1.classList.add("fa-solid", "fa-square-check");
    const i2 = document.createElement("i");
    i2.classList.add("fa-solid", "fa-square");
    const span = document.createElement("span");
    span.innerText = translation[x] ?? x;
    label.append(input, i1, i2, span);
    sel?.append(label);
  });
};

let abortCopy;

const dingAudio = new Audio("./ding-126626.mp3");
export const main = (everyQuestion, hasCheckboxes = false) => {
  if (hasCheckboxes) createCheckboxes(everyQuestion);
  questionsElem.max = hasCheckboxes
    ? Object.values(everyQuestion).reduce((a, b) => a + b.length, 0)
    : everyQuestion.length;
  configElem.addEventListener("submit", (e) => {
    const abortAlert = new AbortController();
    e.preventDefault();
    const n = e.target.elements.questionsNumber.valueAsNumber;
    if (n <= 0 || Number.isNaN(n)) return;
    const timePerQuestion =
      e.target.elements.timePerQuestion.valueAsNumber * 1000;
    if (timePerQuestion <= 0 || Number.isNaN(timePerQuestion)) return;

    const selection = hasCheckboxes
      ? [...e.target.selection.values()]
          .filter(
            (x) =>
              emailToCurso(auth.currentUser?.email) === "2º bach" || x.checked
          )
          .map((x) => x.id)
      : undefined;

    const force5050 = e.target.elements.force5050?.checked;

    if (selection && selection.length === 0)
      return alert("Selecciona al menos una opción de la selección");

    if (
      selection &&
      selection.reduce((a, b) => a + everyQuestion[b].length, 0) < n
    )
      return alert(
        "No hay suficientes preguntas en la selección. Elige más tipos de elementos o reduce el número de preguntas."
      );

    configElem.classList.add("hidden");
    examElem.classList.remove("hidden");

    examElem.querySelector("#currNum").innerText = 1;
    examElem.querySelectorAll(".totalNum")?.forEach((x) => (x.innerText = n));

    const { getNext, getLatest, getEveryQuestion, getCurrIdx } = examGen(
      n,
      everyQuestion,
      selection,
      force5050 ? { name: 0, symbol: 0 } : undefined
    );

    let { start: startGlobal, stop: stopGlobal } = createTimer(
      "#globalTimerContainer",
      timePerQuestion * n
    );

    const { start, stop, reset } = createTimer(
      "#timerPerQuestionContainer",
      timePerQuestion,
      () => {
        dingAudio.play();
        examElem.dispatchEvent(new SubmitEvent("submit"));
      }
    );
    const elem = getNext().html;

    examElem.querySelector("#questions").append(elem);
    elem.querySelector("input").focus();
    examElem.querySelector("#progress").style.width = `${100 / n}%`;
    start();
    startGlobal();
    examElem.addEventListener(
      "submit",
      (e) => {
        e.preventDefault();
        if (examElem.querySelector("#next").innerText === "Corregir") {
          const questions = getEveryQuestion();
          let correctas = 0;
          questions.forEach((question) => {
            question.html.classList.remove("hidden");
            correctas += question.check();
          });
          abortAlert.abort();
          stop(true);
          stopGlobal();

          examElem.querySelector("#next").disabled = true;
          examElem.querySelector("#back").disabled = false;
          examElem.querySelector("#correctAnswers").classList.remove("hidden");

          examElem.querySelector("#corrNum").innerText = correctas;
          sendExamToDB(questions, correctas);
          document.activeElement?.blur();
        } else {
          getLatest().html.classList.add("hidden");
          const question = getNext();
          const idx = getCurrIdx();
          examElem.querySelector("#progress").style.width = `${
            (100 * idx) / n
          }%`;

          examElem.querySelector("#currNum").innerText = idx;
          if (idx === n) {
            examElem.querySelector("#next").innerText = "Corregir";
          }
          examElem.querySelector("#questions").append(question.html);
          reset();
          stopGlobal();
          ({ start: startGlobal, stop: stopGlobal } = createTimer(
            "#globalTimerContainer",
            timePerQuestion * (n - getCurrIdx() + 1)
          ));
          startGlobal();
          question.html.querySelector("input").focus();
        }
      },
      { signal: abortAlert.signal }
    );

    abortCopy = new AbortController();
    document.addEventListener(
      "keydown",
      (e) => {
        if (["C", "X"].includes(e.key) && e.ctrlKey && e.shiftKey) {
          e.preventDefault();
          e.stopPropagation();
          while (examElem.querySelector("#next").innerText !== "Corregir") {
            examElem.dispatchEvent(new SubmitEvent("submit"));
          }
          examElem.dispatchEvent(new SubmitEvent("submit"));
          copyQuestions(getEveryQuestion(), e.key === "X");
        }
      },
      { signal: abortCopy.signal }
    );
  });
};
document.querySelector("#back").addEventListener("click", () => {
  examElem.querySelector("#questions").innerHTML = "";
  examElem.querySelector("#progress").style.width = "0%";
  configElem.classList.remove("hidden");
  examElem.classList.add("hidden");
  examElem.querySelector("#next").innerText = "Siguiente";
  examElem.querySelector("#correctAnswers").classList.add("hidden");
  examElem.querySelector("#next").disabled = false;
  examElem.querySelector("#back").disabled = true;
  abortCopy?.abort();
});

const updateTotalTime = () => {
  const timePerQuestion = timePerQuestionElem.valueAsNumber;
  const questions = questionsElem.valueAsNumber;
  if (timePerQuestion <= 0 || Number.isNaN(timePerQuestion)) return;
  if (questions <= 0 || Number.isNaN(questions)) return;
  totalTimeElem.innerText = formatTime(
    timePerQuestion * questions * 1000,
    false
  );
};

timePerQuestionElem.addEventListener("input", updateTotalTime);
timePerQuestionElem.addEventListener("change", updateTotalTime);
timePerQuestionElem.addEventListener("keyup", updateTotalTime);

questionsElem.addEventListener("input", updateTotalTime);
questionsElem.addEventListener("change", updateTotalTime);
questionsElem.addEventListener("keyup", updateTotalTime);

document.querySelector("#seleccionarTodo")?.addEventListener("click", () => {
  document
    .querySelectorAll("[name=selection]")
    .forEach((x) => (x.checked = true));
});
document.querySelector("#seleccionarNada")?.addEventListener("click", () => {
  if (emailToCurso(auth.currentUser?.email) === "2º bach")
    return alert("Los de 2º bach no pueden cambiar la selección de preguntas");
  document
    .querySelectorAll("[name=selection]")
    .forEach((x) => (x.checked = false));
});
