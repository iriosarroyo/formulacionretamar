export const moleculeWord = (moleculeAsWordStr) => {
  return `<math xmlns="http://www.w3.org/1998/Math/MathML">${moleculeAsWordStr}</math>`;
};

export const copyToWord = async (plainText, htmlText) => {
  const htmlContent = `<html><body>${htmlText}</body></html>`;
  const plainBlob = new Blob([plainText], { type: "text/plain" });
  const htmlBlob = new Blob([htmlContent], { type: "text/html" });
  console.log(htmlContent);
  // Copy to clipboard with multiple formats
  await navigator.clipboard.write([
    new ClipboardItem({
      // "text/plain": plainBlob,
      "text/html": htmlBlob,
    }),
  ]);
};

const questionsToCopy = (questions, withSols) => {
  const qCopy = [...questions];
  qCopy.sort((a, b) => -a.question.type.localeCompare(b.question.type));
  const commonStyle =
    "text-align:center;width:75%;border:1px solid black;vertical-align: middle;";
  const rowHeightCm = 1;
  const questionsTable = qCopy.map((q) => {
    const res = withSols ? `<em>${q.question.res}</em>` : "";
    const formula =
      q.question.type === "symbol"
        ? q.html.querySelector("strong").innerHTML
        : res;
    const name =
      q.question.type === "name"
        ? q.html.querySelector("strong").innerHTML
        : res;
    return `
      <tr style="height: ${rowHeightCm}cm;">
        <td style="${commonStyle}width:25%;">${formula}</td>
        <td style="${commonStyle}">${name}</td>
      </tr>
    `;
  });
  return `<table style="font-family:Aptos, sans-serif;width:100%;border-collapse:collapse;height:${
    qCopy.length * rowHeightCm
  }cm;">
    <thead>
      <tr style="height: ${rowHeightCm}cm;">
        <th style="${commonStyle}width:25%;">Fórmula</th>
        <th style="${commonStyle}">Nombre</th>
      </tr>
    </thead>
    <tbody>
      ${questionsTable.join("")}
    </tbody>`;
};

export const copyQuestions = async (questions, withSols = false) => {
  const plainText = questions.map((q) => q.question.question).join("\n");
  const htmlText = questionsToCopy(questions, withSols);
  await copyToWord(plainText, htmlText);
};
