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
const ip = "http://" + nets["Wi-Fi"][1].address;
const url = ip + ":" + PORT;

qrcode.generate(url);
console.log(url);
