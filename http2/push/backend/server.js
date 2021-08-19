import http2 from "http2";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import handler from "serve-handler";
import nanobuffer from "nanobuffer";

let connections = [];

const msg = new nanobuffer(50);
const getMsgs = () => Array.from(msg).reverse();

msg.push({
  user: "brian?",
  text: "hi",
  time: Date.now(),
});

// openssl req -new -newkey rsa:2048 -new -nodes -keyout key.pem -out csr.pem
// openssl x509 -req -days 365 -in csr.pem -signkey key.pem -out server.crt
// http2 only works over HTTPS
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const server = http2.createSecureServer({
  cert: fs.readFileSync(path.join(__dirname, "/../server.crt")),
  key: fs.readFileSync(path.join(__dirname, "/../key.pem")),
});

server.on("stream", (stream, headers) => {
  const method = headers[":method"];
  const path = headers[":path"];

  // streams will open for everything, we want just GETs on /msgs
  if (path === "/msgs" && method === "GET") {
    // immediately respond with 200 OK and encoding
    stream.respond({
      ":status": 200,
      "content-type": "text/plain; charset=utf-8",
    });

    // write the first response
    stream.write(JSON.stringify({ msg: getMsgs() }));

    // keep track of the connection
    connections.push(stream);

    // when the connection closes, stop keeping track of it
    stream.on("close", () => {
      connections = connections.filter((s) => s !== stream);
    });
  }
});

server.on("request", async (req, res) => {
  const path = req.headers[":path"];
  const method = req.headers[":method"];

  if (path !== "/msgs") {
    // handle the static assets
    return handler(req, res, {
      public: "./frontend",
    });
  } else if (method === "POST") {
    // get data out of post
    const buffers = [];
    for await (const chunk of req) {
      buffers.push(chunk);
    }
    const data = Buffer.concat(buffers).toString();
    const { user, text } = JSON.parse(data);
    msg.push({
      user,
      text,
      time: Date.now(),
    });

    // all done with the request
    res.end();

    // notify all connected users
    connections.forEach((stream) => {
      stream.write(JSON.stringify({ msg: getMsgs() }));
    });
  }
});

// start listening
const port = process.env.PORT || 8080;
server.listen(port, () =>
  console.log(
    `Server running at https://localhost:${port} - make sure you're on httpS, not http`
  )
);
