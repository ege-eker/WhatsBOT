import { downloadMediaMessage, WASocket, proto } from '@whiskeysockets/baileys';
import logger from './logger';

// This function downloads media messages (images, videos, etc.) from messages
export async function downloadMedia(
  sock: WASocket,
  msg: proto.IWebMessageInfo
): Promise<Buffer> {
  const buffer = await downloadMediaMessage(
    msg,
    'buffer',
    {},
    { logger, reuploadRequest: sock.updateMediaMessage }
  );
  return buffer;
}