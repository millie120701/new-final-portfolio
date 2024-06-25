self.onmessage = function (e) {
  console.log(e.data);
  if (e.data.action === "start") {
    startTimer(e.data.interval);
  } else if (e.data.action === "stop") {
    stopTimer();
  }
};

let timerId;

function startTimer(interval) {
  timerId = setInterval(function () {
    postMessage("tick");
  }, interval);
}

function stopTimer() {
  clearInterval(timerId);
}
