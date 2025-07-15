import { WASocket, proto } from '@whiskeysockets/baileys';

export type CommandFunction = (
  sock: WASocket,
  msg: proto.IWebMessageInfo,
  args: string[]
) => Promise<boolean>;
