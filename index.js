import { Config } from "./config/config.js";
import { Cowtopia } from "./src/core/cowtopia.js";
import { Telegram } from "./src/core/telegram.js";
import { Helper } from "./src/utils/helper.js";
import logger from "./src/utils/logger.js";
import twist from "./src/utils/twist.js";

async function operation(acc, query, queryObj) {
  try {
    const cowtopia = new Cowtopia(acc, query, queryObj);
    await cowtopia.login();
    await cowtopia.getGameInfo(true);
    await cowtopia.initWss();
    await cowtopia.claimOfflineProfit();

    await cowtopia.getMission();
    logger.info(`TOTAL MISSION : ${cowtopia.missionList.length}`);
    const oneTimeMissions = cowtopia.missionList.filter(
      (item) => item.period == "one_time"
    );
    const hourlyMissions = cowtopia.missionList.filter(
      (item) => item.period == "hourly"
    );
    const dailyMissions = cowtopia.missionList.filter(
      (item) => item.period == "daily"
    );
    logger.info(`ONE TIME MISSION : ${oneTimeMissions.length}`);
    logger.info(`HOURLY MISSION : ${hourlyMissions.length}`);
    logger.info(`DAILY MISSION : ${dailyMissions.length}`);
    const excludedMission = [
      "add_emoji",
      "telegram_premium",
      "check_in",
      "purchase-daily",
    ];
    for (const item of oneTimeMissions) {
      if (!excludedMission.includes(item.key) && item.completed == false) {
        await cowtopia.checkMission(item.key);
      }
    }
    for (const item of hourlyMissions) {
      if (!excludedMission.includes(item.key) && item.completed == false) {
        await cowtopia.checkMission(item.key);
      }
    }
    for (const item of dailyMissions) {
      if (!excludedMission.includes(item.key) && item.completed == false) {
        await cowtopia.checkMission(item.key);
      }
    }
    await cowtopia.conquest();

    twist.clear(acc);
    twist.clearInfo();
    await Helper.delay(
      60000 * 60,
      acc,
      `Account ${acc.id} Processing Complete`,
      cowtopia
    );
    await operation(acc, query, queryObj);
  } catch (error) {
    twist.clear(acc);
    twist.clearInfo();
    await Helper.delay(
      10000,
      acc,
      `Error : ${error.message}, Retrying after 10 Second`
    );
    await operation(acc, query, queryObj);
  }
}

let init = false;
async function startBot() {
  return new Promise(async (resolve, reject) => {
    try {
      logger.info(`BOT STARTED`);
      if (
        Config.TELEGRAM_APP_ID == undefined ||
        Config.TELEGRAM_APP_HASH == undefined
      ) {
        throw new Error(
          "Please configure your TELEGRAM_APP_ID and TELEGRAM_APP_HASH first"
        );
      }
      const tele = await new Telegram();
      if (init == false) {
        await tele.init();
        init = true;
      }

      const sessionList = Helper.getSession("sessions");
      const paramList = [];

      for (const acc of sessionList) {
        await tele.useSession("sessions/" + acc);
        tele.session = acc;
        const user = await tele.client.getMe();
        const query = await tele
          .resolvePeer()
          .then(async () => {
            return await tele.initWebView();
          })
          .catch((err) => {
            throw err;
          });

        const queryObj = Helper.queryToJSON(query);
        await tele.disconnect();
        paramList.push([user, query, queryObj]);
      }

      const promiseList = paramList.map(async (data) => {
        await operation(data[0], data[1], data[2]);
      });

      await Promise.all(promiseList);
      resolve();
    } catch (error) {
      logger.info(`BOT STOPPED`);
      logger.error(JSON.stringify(error));
      reject(error);
    }
  });
}

(async () => {
  try {
    logger.clear();
    logger.info("");
    logger.info("Application Started");
    console.log("COWTOPIA BOT");
    console.log("By : Widiskel");
    console.log("Dont forget to run git pull to keep up to date");
    await startBot();
  } catch (error) {
    twist.clear();
    twist.clearInfo();
    console.log("Error During executing bot", error);
    await startBot();
  }
})();
