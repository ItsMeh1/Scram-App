"use strict";

async function registerSW() {
    if (!("serviceWorker" in navigator)) {
        throw new Error("Service workers are not supported");
    }

    const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
    });

    await navigator.serviceWorker.ready;

    console.log("Service worker registered");
}

// Wait until Scramjet loader is ready
window.addEventListener("load", async () => {
    try {
        // Load Scramjet internals
        const { ScramjetController } = await $scramjetLoadController();

        const scramjet = new ScramjetController({
            files: {
                wasm: "/scram/scramjet.wasm.wasm",
                all: "/scram/scramjet.all.js",
                sync: "/scram/scramjet.sync.js",
            },
        });

        await scramjet.init();

        const connection = new BareMux.BareMuxConnection("/baremux/worker.js");

        const urlInput = document.getElementById("urlInput");

        async function startScramjet(rawInput) {
            if (!rawInput) return;

            // Add https:// if missing
            let url = rawInput.trim();
            if (!url.startsWith("http://") && !url.startsWith("https://")) {
                url = "https://" + url;
            }

            try {
                await registerSW();
            } catch (err) {
                console.error("Service Worker failed:", err);
                return;
            }

            let wispUrl =
                (location.protocol === "https:" ? "wss" : "ws") +
                "://" +
                location.host +
                "/wisp/";

            if ((await connection.getTransport()) !== "/libcurl/index.mjs") {
                await connection.setTransport("/libcurl/index.mjs", [
                    { websocket: wispUrl },
                ]);
            }

            // Remove old frame if it exists
            const oldFrame = document.getElementById("sj-frame");
            if (oldFrame) oldFrame.remove();

            const frame = scramjet.createFrame();
            frame.frame.id = "sj-frame";
            document.body.appendChild(frame.frame);

            frame.go(url);
        }

        // Handle Enter key
        urlInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                startScramjet(urlInput.value);
            }
        });

    } catch (err) {
        console.error("Scramjet init failed:", err);
    }
});
