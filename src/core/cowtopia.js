import { API } from "../api/api.js";
import { Helper } from "../utils/helper.js";
import logger from "../utils/logger.js";
import { io } from "socket.io-client";

export class Cowtopia extends API {
  constructor(account, query, queryObj) {
    super(query, "https://cowtopia-be.tonfarmer.com");
    this.account = account;
    this.query = query;
    this.queryObj = queryObj;
  }

  async login() {
    try {
      await Helper.delay(500, this.account, `Try to Login...`, this);
      const res = await this.fetch("/auth", "POST", undefined, undefined, {
        "X-Tg-Data": this.query,
      });

      await Helper.delay(1000, this.account, `Successfully Login`, this);
      this.token = `Bearer ${res.data.access_token}`;
      this.plainToken = res.data.access_token;
      this.user = res.data.user;
    } catch (error) {
      throw error;
    }
  }
  async getGameInfo(msg = false) {
    try {
      if (msg)
        await Helper.delay(500, this.account, `Getting game info...`, this);
      const res = await this.fetch("/user/game-info?", "GET", this.token);

      if (msg)
        await Helper.delay(
          500,
          this.account,
          `Successfully Get Game info`,
          this
        );
      this.game = res.data;
      this.user = res.data.user;
    } catch (error) {
      throw error;
    }
  }

  async initWss() {
    return new Promise(async (resolve, reject) => {
      await Helper.delay(1000, this.account, `Connecting to WSS...`, this);

      this.socket = io("wss://cowtopia-ws.tonfarmer.com", {
        auth: {
          token: this.plainToken,
        },
        transports: ["websocket"],
      });

      this.socket.on("connect", async () => {
        await Helper.delay(1000, this.account, `WSS Connected...`, this);
        logger.info("WSS Handshake completed and connected.");
        logger.info(`Socket ID: ${this.socket.id}`);
        resolve();
      });

      this.socket.on("connect_error", async (error) => {
        await Helper.delay(
          1000,
          this.account,
          `WSS Connection Error: ${error.message}`,
          this
        );
        logger.error(`WSS Handshake Error: ${error.message}`);
        reject(error);
      });

      this.socket.on("connect_timeout", async () => {
        await Helper.delay(1000, this.account, `WSS Connection Timeout`, this);
        logger.error("WSS Handshake Timeout");
        reject(new Error("WSS Handshake Timeout"));
      });

      this.socket.on("error", async (error) => {
        await Helper.delay(
          1000,
          this.account,
          `WSS Error : ${error.message}`,
          this
        );
        logger.error(`WSS Error : ${error.message}`);
        reject(error);
      });

      this.socket.on("disconnect", async (reason) => {
        await Helper.delay(
          1000,
          this.account,
          `WSS Connection Closed ${reason}...`,
          this
        );
        logger.info(`WSS Disconnected: ${reason}`);
      });
    });
  }

  async getMission() {
    try {
      await Helper.delay(500, this.account, `Getting Missions...`, this);
      this.missionList = [];
      const mainMission = await this.fetch(
        "/mission?group=main",
        "GET",
        this.token
      );
      // console.log(mainMission.data.missions.length);
      this.missionList.push(...mainMission.data.missions);
      const partnerMission = await this.fetch(
        "/mission?group=partner",
        "GET",
        this.token
      );
      // console.log(partnerMission.data.missions.length);
      this.missionList.push(...partnerMission.data.missions);

      await Helper.delay(1000, this.account, `Successfully Get Misisons`, this);
    } catch (error) {
      throw error;
    }
  }

  async checkMission(key) {
    return new Promise(async (resolve, reject) => {
      try {
        await Helper.delay(
          500,
          this.account,
          `Checking Missions ${key}....`,
          this
        );
        const eventName = "check-mission";
        const eventData = { mission_key: key };
        const messageHandler = async (msg) => {
          try {
            logger.info(`Receiving WSS Msg : ${JSON.stringify(msg)}`);
            if (msg.data.completed == true) {
              await Helper.delay(
                2000,
                this.account,
                `Mission ${key} Completed Successfully`,
                this
              );
            } else {
              await Helper.delay(
                1000,
                this.account,
                `Failed to Complete Mission ${key}`,
                this
              );
            }
            await this.getGameInfo();
            await this.socket.off(eventName, await messageHandler);
            resolve();
          } catch (error) {
            logger.error(`Error Parsing Msg : ${error.message}`);
            reject(new Error(`Error Parsing Msg : ${error.message}`));
          }
        };
        await this.socket.emit(eventName, eventData);
        await this.socket.on(eventName, messageHandler);
      } catch (error) {
        throw error;
      }
    });
  }
  async claimOfflineProfit() {
    return new Promise(async (resolve, reject) => {
      try {
        await Helper.delay(
          1000,
          this.account,
          `Claiming Offline Profit....`,
          this
        );
        const res = await this.fetch(
          "/user/offline-profit?",
          "GET",
          this.token
        );

        await Helper.delay(
          1000,
          this.account,
          `Claiming ${res.data.profit} Offline Profit....`,
          this
        );
        const eventName = "claim-offline";
        const eventData = { boost: false };
        const messageHandler = async (msg) => {
          try {
            logger.info(`Receiving WSS Msg : ${JSON.stringify(msg)}`);
            this.user = msg.data.user;

            await Helper.delay(
              2000,
              this.account,
              `Successfully Claim ${msg.data.profit} Offline Profit....`,
              this
            );
            await this.getGameInfo();
            await this.socket.off(eventName, await messageHandler);
            resolve();
          } catch (error) {
            logger.error(`Error Parsing Msg : ${error.message}`);
            reject(new Error(`Error Parsing Msg : ${error.message}`));
          }
        };
        await this.socket.emit(eventName, eventData);
        await this.socket.on(eventName, messageHandler);
      } catch (error) {
        reject(error);
      }
    });
  }

  async conquest() {
    return new Promise(async (resolve, reject) => {
      try {
        await Helper.delay(1000, this.account, `Starting Conquest....`, this);
        const res = await this.fetch("/conquest/info?", "GET", this.token);
        const enemies = res.data.enemies;
        const highestWinRateEnemy = enemies.reduce((max, enemy) => {
          return enemy.win_rate > max.win_rate ? enemy : max;
        }, enemies[0]);

        if (
          res.data.cool_down == 0 &&
          this.user.money > res.data.attack_fee_money
        ) {
          await Helper.delay(
            3000,
            this.account,
            `Enemy With Highest Win Rate ${res.data.profit} `,
            this
          );
          const eventName = "conquest-attack";
          const eventData = {
            enemy_id: highestWinRateEnemy.user_id,
            currency: "money",
          };
          const messageHandler = async (msg) => {
            try {
              logger.info(`Receiving WSS Msg : ${JSON.stringify(msg)}`);

              await Helper.delay(
                2000,
                this.account,
                `Successfully Attack With Result ${
                  msg.data.win ? "WIN" : "LOSE"
                }, Got ${msg.data.loot} Money And ${msg.data.trophy}`,
                this
              );

              await this.socket.off(eventName, await messageHandler);
              await this.getGameInfo();
              resolve();
            } catch (error) {
              logger.error(`Error Parsing Msg : ${error.message}`);
              reject(new Error(`Error Parsing Msg : ${error.message}`));
            }
          };
          await this.socket.emit(eventName, eventData);
          await this.socket.on(eventName, messageHandler);
        } else {
          await Helper.delay(
            1000,
            this.account,
            `Conquest Still On Cooldown Or Not Enough Money...`,
            this
          );
          resolve();
        }
      } catch (error) {
        reject(error);
      }
    });
  }
}
