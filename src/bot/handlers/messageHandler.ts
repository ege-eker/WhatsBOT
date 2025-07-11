import { WASocket, proto } from '@whiskeysockets/baileys';
import commandHandler from './commandHandler';
import mediaHandler from './mediaHandler';
//import locationHandler from './locationHandler';
import textHandler from './textHandler';

type HandlerFunction = (
  sock: WASocket,
  msg: proto.IWebMessageInfo
) => Promise<boolean>;

const handlers: HandlerFunction[] = [
    commandHandler,
    textHandler,
    mediaHandler,
    //locationHandler,
    //voiceHandler, contactHandler, documentHandler...
];

export default async function messageHandler(
  sock: WASocket,
  { messages, type }: { messages: proto.IWebMessageInfo[]; type: string }
) {
  if (type !== 'notify') return;

  for (const msg of messages) {
    const from = msg.key.remoteJid;
    if (!msg.message){
      console.warn(`${from} dan gelen bir mesaj değil`);
      continue;
    }

    for (const handler of handlers) {
      const handled = await handler(sock, msg);
      if (handled) break; // first handler that processes the message stops further processing
    }
  }
}