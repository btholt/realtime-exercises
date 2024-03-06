const chat = document.getElementById("chat");
const msgs = document.getElementById("msgs");

// let's store all current messages here
let allChat = [];

const INTERVAL = 3000;

let makeNewRequestTime = 0;

const BACKOFF = 5000;

let failedAttempts = 0;

// a submit listener on the form in the HTML
chat.addEventListener("submit", function (e) {
  e.preventDefault();
  postNewMsg(chat.elements.user.value, chat.elements.text.value);
  chat.elements.text.value = "";
});

async function postNewMsg(user, text) {
  const data = {
    user,
    text,
  };

  const options = {
    method: "POST",
    body: JSON.stringify(data),
    headers: {
      "Content-Type": "application/json",
    },
  };

  await fetch("/poll", options);
}

async function getNewMsgs() {
  let jsonData;
  try {
    const res = await fetch("/poll");
    jsonData = await res.json();

    if (res.status >= 400) {
      throw new Error(`Request failed with status: ${res.status}`);
    }

    allChat = jsonData.msg;
    render();
    failedAttempts;
  } catch (e) {
    //back off and try again
    console.error("polling error", e);
    failedAttempts++;
  }
}

function render() {
  // as long as allChat is holding all current messages, this will render them
  // into the ui. yes, it's inefficent. yes, it's fine for this example
  const html = allChat.map(({ user, text, time, id }) =>
    template(user, text, time, id)
  );
  msgs.innerHTML = html.join("\n");
}

// given a user and a msg, it returns an HTML string to render to the UI
const template = (user, msg) =>
  `<li class="collection-item"><span class="badge">${user}</span>${msg}</li>`;

// this is the main loop that will poll for new messages
async function rafTimer(time) {
  if (makeNewRequestTime <= time) {
    await getNewMsgs();
    makeNewRequestTime = time + INTERVAL + failedAttempts * BACKOFF;
  }

  requestAnimationFrame(rafTimer);
}
requestAnimationFrame(rafTimer);
