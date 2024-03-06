const chat = document.getElementById("chat");
const msgs = document.getElementById("msgs");
const presence = document.getElementById("presence-indicator");

// this will hold all the most recent messages
let allChat = [];
let reader;
let readerRes;
let done;

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

  // request options
  const options = {
    method: "POST",
    body: JSON.stringify(data),
    headers: {
      "Content-Type": "application/json",
    },
  };

  // send POST request
  // we're not sending any json back, but we could
  await fetch("/msgs", options);
}

async function getNewMsgs() {
  const utf8Decoder = new TextDecoder("utf-8");
  try {
    const res = await fetch("/msgs");
    //reader is for continuous stream of data
    reader = res.body.getReader();
  } catch (e) {
    console.error(e);
  }
  presence.innerText = "🟢";
  do {
    try {
      readerRes = await reader.read();
    } catch (e) {
      console.error("reader fail", e);
      presence.innerText = "🔴";
      return;
    }
    const chunck = utf8Decoder.decode(readerRes.value, { stream: true });
    done = readerRes.done;

    if (chunck) {
      try {
        const json = JSON.parse(chunck);
        allChat = json.msg;
        render();
      } catch (e) {
        console.error("parse error", e);
      }
    }
  } while (!done);
  presence.innerText = "🔴";
}

function render() {
  const html = allChat.map(({ user, text, time, id }) =>
    template(user, text, time, id)
  );
  msgs.innerHTML = html.join("\n");
}

const template = (user, msg) =>
  `<li class="collection-item"><span class="badge">${user}</span>${msg}</li>`;

getNewMsgs();
