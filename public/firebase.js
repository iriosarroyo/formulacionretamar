import { initializeApp } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-analytics.js";
import {
  getDatabase,
  ref,
  set,
  get,
  push,
  runTransaction,
  onValue,
} from "https://www.gstatic.com/firebasejs/11.5.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyBKsxq6ki-ID0Cqs8vVw0PaKVmKmgmdgiw",
  authDomain: "formulacionretamar.firebaseapp.com",
  projectId: "formulacionretamar",
  storageBucket: "formulacionretamar.firebasestorage.app",
  messagingSenderId: "571015351977",
  appId: "1:571015351977:web:11e757996edc08e8b363b8",
  measurementId: "G-4QJYBLNDB2",
  databaseURL:
    "https://formulacionretamar-default-rtdb.europe-west1.firebasedatabase.app",
};

// Initialize Firebase

export const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getDatabase(app);
export const writeUserData = (userId, name, email, imageUrl) => {
  set(ref(db, "users/" + userId), {
    username: name,
    email: email,
    profile_picture: imageUrl,
  });
};

export const exists = (path) =>
  new Promise((res, rej) => {
    get(ref(db, path))
      .then((snap) => res(snap.exists()))
      .catch(rej);
  });

export const existsUser = (userId) => exists(`users/${userId}`);

export const updateStats = (reference, type, numPregs, numCorr) => {
  if (!auth.currentUser) return Promise.reject("No user");
  return runTransaction(ref(db, `${reference}/${type}`), (stats) => {
    if (stats) {
      stats.numPregs += numPregs;
      stats.numCorr += numCorr;
      stats.numExam++;
    } else {
      stats = {
        numPregs,
        numCorr,
        numExam: 1,
      };
    }
    return stats;
  });
};

export const updateGlobalStats = (type, numPregs, numCorr) => {
  return updateStats("globalStats", type, numPregs, numCorr);
};

export const updateUserStats = (type, numPregs, numCorr) => {
  return updateStats(
    `users/${auth.currentUser?.uid}/stats`,
    type,
    numPregs,
    numCorr
  );
};

export const updateGlobalAndUserStats = (numPregs, numCorr) => {
  const type = location.pathname.slice(1).replace(".html", "") || "index";
  return Promise.allSettled([
    updateGlobalStats(type, numPregs, numCorr),
    updateUserStats(type, numPregs, numCorr),
  ]);
};

const pushExam = (preguntas, correctas) => {
  if (!auth.currentUser) return Promise.reject("No user");
  const enunciados = preguntas.map((x) => x?.question?.question).join(";");
  return push(ref(db, `users/${auth.currentUser.uid}/exams`), {
    enunciados,
    numPregs: preguntas.length,
    numCorr: correctas,
  });
};

const updateLocalStorage = (key, value) => {
  localStorage.setItem(key, Number(localStorage.getItem(key) ?? 0) + value);
};

export const sendExamToDB = (preguntas, correctas) => {
  const type = location.pathname.slice(1).replace(".html", "") || "index";
  try {
    updateLocalStorage(type + "/numPregs", preguntas.length);
    updateLocalStorage(type + "/numCorr", correctas);
    updateLocalStorage(type + "/numExam", 1);
  } catch (e) {
    console.error(e);
  }
  return Promise.allSettled([
    pushExam(preguntas, correctas),
    updateGlobalAndUserStats(preguntas.length, correctas),
  ]).then((results) => {
    const [pushResult, updateResult] = results;
    if (pushResult.status === "rejected" && pushResult.reason !== "No user") {
      alert(
        `Error al guardar el examen: ${pushResult.reason}. 
Código de error: 001-${preguntas.length}-${correctas}.
Envía este código a inigo.rios@retamar.es`
      );
    }
    if (
      updateResult.status === "rejected" &&
      updateResult.reason !== "No user"
    ) {
      alert(
        `Error al guardar las estadísticas: ${updateResult.reason}. 
Código de error: 002-${preguntas.length}-${correctas}.
Envía este código a inigo.rios@retamar.es`
      );
    }
    return results;
  });
};

export const onStats = (path, idEnd) => {
  return onValue(ref(db, path), (snap) => {
    const { numCorr = 0, numPregs = 0, numExam = 0 } = snap.val() ?? {};
    document.querySelector(`#numExam${idEnd}`).innerText = numExam;
    document.querySelector(`#numPregs${idEnd}`).innerText = numPregs;
    document.querySelector(`#numCorr${idEnd}`).innerText = `${numCorr} (${
      Math.round((numCorr / (numPregs || 1)) * 10000) / 100
    }%)`;
  });
};

export const allUsers = () => {
  return get(ref(db, "users")).then((x) => x.val());
};

export const onExamsFromUser = (userId, listener) => {
  return onValue(ref(db, `users/${userId}/exams`), (snap) => {
    listener(snap.val() ?? {});
  });
};
