import { Twisters } from "twisters";
import { Helper } from "./helper.js";
import logger from "./logger.js";
import { Cowtopia } from "../core/cowtopia.js";

class Twist {
  constructor() {
    /** @type  {Twisters}*/
    this.twisters = new Twisters();
  }

  /**
   * @param {string} acc
   * @param {Cowtopia} cowtopia
   * @param {string} msg
   * @param {string} delay
   */
  log(msg = "", acc = "", cowtopia = new Cowtopia(), delay) {
    // console.log(acc);
    if (delay == undefined) {
      logger.info(`${acc.id} - ${msg}`);
      delay = "-";
    }

    const user = cowtopia.user ?? {};
    const money = user.money ?? "-";
    const token = user.token ?? "-";

    this.twisters.put(acc.id, {
      text: `
================= Account ${acc.id} =============
Name      : ${acc.firstName} ${acc.lastName}
Money     : ${money}
Token     : ${token}

Status : ${msg}
Delay : ${delay}
==============================================`,
    });
  }
  /**
   * @param {string} msg
   */
  info(msg = "") {
    this.twisters.put(2, {
      text: `
==============================================
Info : ${msg}
==============================================`,
    });
    return;
  }

  clearInfo() {
    this.twisters.remove(2);
  }

  clear(acc) {
    this.twisters.remove(acc);
  }
}
export default new Twist();
