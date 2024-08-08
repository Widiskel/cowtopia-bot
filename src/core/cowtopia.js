import { API } from "../api/api.js";
import { Helper } from "../utils/helper.js";
import logger from "../utils/logger.js";

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
      this.user = res.data.user;
    } catch (error) {
      throw error;
    }
  }
  async getGameInfo() {
    try {
      await Helper.delay(500, this.account, `Getting game info...`, this);
      const res = await this.fetch("/user/game-info?", "GET", this.token);

      await Helper.delay(500, this.account, `Successfully Get Game info`, this);
      this.game = res.data;
      this.user = res.data.user;
    } catch (error) {
      throw error;
    }
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
    try {
      await Helper.delay(
        500,
        this.account,
        `Checking Missions ${key}....`,
        this
      );
      const res = await this.fetch("/mission/check", "POST", this.token, {
        mission_key: key,
      });

      if (res.data.completed == true) {
        await Helper.delay(
          1000,
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
    } catch (error) {
      throw error;
    }
  }
  async claimOfflineProfit() {
    try {
      await Helper.delay(
        1000,
        this.account,
        `Claiming Offline Profit....`,
        this
      );
      const res = await this.fetch("/user/offline-profit?", "GET", this.token);

      await Helper.delay(
        1000,
        this.account,
        `Claiming ${res.data.profit} Offline Profit....`,
        this
      );

      const claim = await this.fetch(
        "/user/claim-offline-profit",
        "POST",
        this.token,
        {
          boost: false,
        }
      );

      await Helper.delay(
        2000,
        this.account,
        `Successfully Claim ${claim.data.profit} Offline Profit....`,
        this
      );
    } catch (error) {
      throw error;
    }
  }
}
