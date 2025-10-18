import { DisconnectReason, makeWASocket, useMultiFileAuthState } from '@whiskeysockets/baileys';
import qrcode from 'qrcode-terminal';
import handleMessage from './handlers/messageHandler';
import { pino } from 'pino';
import * as fs from "fs"
import path from 'path';

export default async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('auth');
  const sock = makeWASocket({ auth: state, markOnlineOnConnect: false, logger: pino({ level: 'warn' }), version: [2, 3000, 1027934701] });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, qr, lastDisconnect } = update;
    if (qr) {
      console.log("QR Created")
      qrcode.generate(qr, { small: true })
    };
    if (connection === 'close' && (lastDisconnect?.error as any)?.output?.statusCode === DisconnectReason.restartRequired) {
      return startBot()
    }
    else if (connection === "close") {
      fs.rmdirSync(path.join(__dirname, "..", "..", "auth"))
      return startBot()
    }
  });

  sock.ev.on('messages.upsert', (msg) => handleMessage(sock, msg));
}
