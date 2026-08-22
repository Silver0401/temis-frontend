/**
 * Generates qr code that scanned redirects to the webpage served
 * by the development server over lan
 *
 * NOTE: this is written in js because ts-node does not
 * support esnext
 */
const dotenv = require("dotenv");
dotenv.config();

const { networkInterfaces } = require("os");
const qrcode = require("qrcode-terminal");

const PORT = process.env.PORT || 3000;

const nets = networkInterfaces();
const selectedNetsList = nets["en0"].filter((net) => net.family === "IPv4");

selectedNetsList.forEach((netItem) => {
  const ip = "http://" + netItem.address;
  const url = ip + ":" + PORT;
  qrcode.generate(url);
  console.log(url);
});
