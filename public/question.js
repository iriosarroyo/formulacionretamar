import { pickFromSelection, pickRandomNoRep, reset } from "./random.js";

/**
 *
 * @param {{question:string, check: () => {}, res: string}} q
 * @returns
 */
const createQuestion = (q) => {
  const div = document.createElement("div");
  div.classList.add("question");
  const strong = document.createElement("strong");
  strong.innerHTML = q.question;
  div.append(strong);
  const input = document.createElement("input");
  div.append(input);
  const span = document.createElement("span");
  div.append(span);

  const checkQ = () => {
    const { check, res } = q;
    const isCorrect = check(input.value);

    if (isCorrect) {
      div.classList.add("correct");
      span.innerText = "Correcto";
    } else {
      div.classList.add("incorrect");
      span.innerHTML = "Incorrecto: " + res;
    }
    return isCorrect;
  };

  return {
    html: div,
    check: checkQ,
    question: q,
  };
};

export const examGen = (n, questions, selection, types) => {
  const processedQuestions = [];
  let i = 0;
  reset();
  const randomQuestion = Array.isArray(questions)
    ? Array(n)
        .fill(null)
        .map(() => pickRandomNoRep(questions))
    : pickFromSelection(n, questions, selection, types);

  function* nextQuestion() {
    for (const q of randomQuestion) {
      const result = createQuestion(q);
      processedQuestions.push(result);
      i++;
      yield result;
    }
  }

  const gen = nextQuestion(randomQuestion);

  const getEveryQuestion = () => {
    while (true) {
      const { done } = gen.next();
      if (done) break;
    }
    return processedQuestions;
  };

  const getNext = () => {
    const { value, done } = gen.next();
    if (done) return null;
    return value;
  };

  const getLatest = () => processedQuestions[processedQuestions.length - 1];

  return {
    getNext,
    getEveryQuestion,
    getLatest,
    getCurrIdx: () => i,
  };
};

const str2Val = (string) =>
  string
    .split(",")
    .filter((x) => x.trim())
    .map((x) => parseInt(x));

const arrayDiff = (arr1, arr2) => {
  if (arr1.length !== arr2.length) return false;
  arr1.sort();
  arr2.sort();
  return arr1.every((val, i) => val === arr2[i]);
};

/**
 *
 * @param {string} userVal
 * @param {{valencias:Number[]}} resultValencias
 */
export const checkValencias = (userVal, resultValencias) => {
  userVal = str2Val(userVal.trim().normalize().replace(/[ ()]/g, ""));
  //   if (!userVal.includes(")") && userVal.includes("(")) userVal += ")";
  //   const openPar = userVal.indexOf("(");
  //   const closePar = userVal.indexOf(")");
  //   let userSecundarias = [];
  //   let userPrincipales = [];
  //   if (openPar !== -1) {
  //     const start = openPar === 0 ? closePar + 1 : 0;
  //     const end = openPar === 0 ? undefined : openPar;
  //     userPrincipales = str2Val(userVal.slice(start, end));
  //     userSecundarias = str2Val(userVal.slice(openPar + 1, closePar - 1));
  //   } else userPrincipales = str2Val(userVal);

  return arrayDiff(userVal, resultValencias);
};
