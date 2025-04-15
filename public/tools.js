export const isAdmin = (email) => email?.match(/[^0-9]@retamar\.es$/);
const CURSOS = ["2º bach", "1º bach", "4º ESO"];
export const emailToCurso = (email) => {
  if (!email) return null;
  if (isAdmin(email)) return null;
  const endYear = parseInt(email.split(".").at(-2).split("@").at(0)) + 2000;
  const now = new Date();
  let idx = endYear - now.getFullYear();
  if (now.getMonth() >= 7) idx -= 1;
  return CURSOS[idx];
};

let abortControllers = {};
export const disableInput = (input) => {
  input.checked = true;
  input.disabled = true;
  abortControllers[input.id] = new AbortController();
  input.parentElement.addEventListener(
    "click",
    () => {
      alert("Los de 2º bach no pueden cambiar la selección de preguntas");
    },
    {
      signal: abortControllers[input.id].signal,
    }
  );
};

export const enableInput = (input) => {
  input.disabled = false;
  abortControllers[input.id]?.abort();
};
export const charge2str = (charge) => {
  if (charge === 0) return "";
  if (Math.abs(charge) === 1) return charge > 0 ? "+" : "-";
  return charge > 0 ? `${charge}+` : `${Math.abs(charge)}-`;
};
