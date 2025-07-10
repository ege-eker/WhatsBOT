import { makeWASocket, useMultiFileAuthState } from '@whiskeysockets/baileys';
import qrcode from 'qrcode-terminal';
import handleMessage from './handlers/messageHandler';
import { pino } from 'pino';

export default async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('auth');
  const sock = makeWASocket({ auth: state, markOnlineOnConnect: false, logger: pino({ level: 'warn' }) });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, qr, lastDisconnect } = update;
    if (qr) qrcode.generate(qr, { small: true });
    if (connection === 'close') {
      if ((lastDisconnect?.error as any)?.output?.statusCode !== 401) startBot();
    } else if (connection === 'open') {
      console.log('✅ Connected');
    }
  });

  sock.ev.on('messages.upsert', (msg) => handleMessage(sock, msg));
}