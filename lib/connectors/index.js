// lib/connectors/index.js
import { slackConnector } from "./slack";
import { discordConnector } from "./discord";
import { gmailConnector } from "./gmail";

export const connectors = {
  slack: slackConnector,
  discord: discordConnector,
  gmail: gmailConnector,
};
