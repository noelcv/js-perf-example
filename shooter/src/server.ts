import { createGameRunner, onClose, onMessage } from "./game";
import * as consts from "./game/consts";
import { getConfig } from "./cli";
import { getLogger, initLogger } from "./logger";
import { getWriter } from "./game/data-writer";
import * as uws from "uWebSockets.js";

const args = getConfig();
consts.initFromEnv();
consts.initFromCLI(args);
initLogger(args);
getWriter(args);

const runner = createGameRunner();
/* Non-SSL is simply App() */

getLogger().info(args, "starting server");
uws
  .App()
  .ws("/*", {
    close: (ws) => {
            onClose(ws);
        },
    open: (ws) => {
            runner(ws);
        },
    message: (ws, message) => {
       onMessage(ws, Buffer.from(message).toString());
    },
  })
  .listen(args.port, (listenSocket) => {
    if (listenSocket) {
      getLogger().info("listening on port", args.port);
      console.log(`Listening to port ${args.port}`);
    } else {
      getLogger().error("cannot start server");
      console.error("cannot start server");
    }
  });
