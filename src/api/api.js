import { Helper } from "../utils/helper.js";
import logger from "../utils/logger.js";

export class API {
  constructor(query, url) {
    this.url = url;
    this.origin = url;
    this.ua = Helper.randomUserAgent();
    this.query = query;
  }

  generateHeaders(token) {
    const headers = {
      Accept: "application/json, text/plain, */*",
      "Accept-Language": "en-US,en;q=0.9,id;q=0.8",
      "Content-Type": "application/json",
      "Sec-Fetch-Dest": "empty",
      "Sec-Fetch-Site": "same-site",
      "Sec-Fetch-Mode": "cors",
      Host: this.host,
      Origin: this.origin,
      Referer: this.origin + "/",
      "X-Chain-Id": 43113,
      "X-Lang": "en",
      "X-Os": "miniapp",
    };

    if (token) {
      headers.Authorization = token;
    }

    return headers;
  }

  async fetch(endpoint, method, token, body = {}, additionalHeader = {}) {
    try {
      const url = `${this.url}${endpoint}`;
      const headers = {
        ...additionalHeader,
        ...this.generateHeaders(token),
      };
      const options = {
        headers,
        method,
      };
      logger.info(`${method} : ${url}`);
      logger.info(`Request Header : ${JSON.stringify(headers)}`);

      if (method !== "GET") {
        options.body = `${JSON.stringify(body)}`;
        logger.info(`Request Body : ${options.body}`);
      }

      const res = await fetch(url, options);

      logger.info(`Response : ${res.status} ${res.statusText}`);
      if (res.ok || res.status == 400) {
        const data = await res.json();
        logger.info(`Response Data : ${JSON.stringify(data)}`);
        return data;
      } else {
        throw new Error(`${res.status} - ${res.statusText}`);
      }
    } catch (err) {
      logger.error(`Error : ${err.message}`);
      throw err;
    }
  }
}