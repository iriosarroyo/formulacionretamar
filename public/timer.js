export const formatTime = (time, removeHours = true) => {
  const hours = Math.floor(time / 3_600_000);
  const minutes = Math.floor((time % 3_600_000) / 60000);
  const seconds = Math.floor(((time % 3_600_000) % 60000) / 1000);
  const finalTime = [hours, minutes, seconds]
    .slice(Number(hours < 1 && removeHours))
    .map((t) => t.toString().padStart(2, "0"));
  return finalTime.join(":");
};

export const createTimer = (selector, duration, onEnd) => {
  const timer = document.querySelector(selector);
  let timeEnd;
  let interval;

  const stop = (preventOnEnd = false) => {
    clearInterval(interval);
    timer.classList.add("hidden");
    timer.classList.remove("alert");
    if (!preventOnEnd && onEnd) onEnd();
  };

  const start = () => {
    timeEnd = Date.now() + duration + 500;
    timer.classList.remove("hidden");
    timer.classList.remove("alert");
    interval = setInterval(() => {
      const remaining = Math.max(timeEnd - Date.now(), 0);
      timer.querySelector("span").innerHTML = formatTime(remaining);
      if (remaining <= 10_000) timer.classList.add("alert");
      if (remaining <= 0) stop();
    }, 200);
  };

  const reset = (preventOnEnd = true) => {
    stop(preventOnEnd);
    start();
  };

  return {
    start,
    stop,
    reset,
  };
};
