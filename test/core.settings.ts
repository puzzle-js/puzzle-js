import * as path from "path";
import * as fs from "fs";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";


export const TLS_KEY = fs.readFileSync(path.join(__dirname, '/keys/server.orig.key'));
export const TLS_CERT = fs.readFileSync(path.join(__dirname, '/keys/server.orig.crt'));
export const TLS_PASS = '123321';
