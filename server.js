import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";

import { createBareServer } from "@tomphttp/bare-server-node";
import { createWispServer } from "@mercuryworkshop/wisp-server-node";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);

const bare = createBareServer("/baremux/");
const wisp = createWispServer();

app.use(express.static(path.join(__dirname, "public")));
app.use("/scram/", express.static(path.join(__dirname, "scram")));

app.use("/baremux/", (req, res) => {
    if (bare.shouldRoute(req)) {
        bare.routeRequest(req, res);
    } else {
        res.status(404).end();
    }
});

server.on("upgrade", (req, socket, head) => {
    if (req.url.startsWith("/baremux/")) {
        bare.routeUpgrade(req, socket, head);
    } else if (req.url.startsWith("/wisp/")) {
        wisp.routeUpgrade(req, socket, head);
    } else {
        socket.destroy();
    }
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
