import {WASocket, proto} from "@whiskeysockets/baileys";
import fs from 'fs';
import path from 'path';
import { downloadMedia } from '../utils/download';

export default async function mediaHandler(
    sock: WASocket,
    msg: proto.IWebMessageInfo
): Promise<boolean> {
    const from = msg.key.remoteJid;
    const imageMessage = msg.message?.imageMessage;
    const videoMessage = msg.message?.videoMessage;

    if (!msg.message || (!msg.message.imageMessage && !msg.message.videoMessage)) {
        console.warn(`${from} : Message is not a media message`);
        return false; // not handled
    }

    try {
        const buffer = await downloadMedia(sock, msg);
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const mediaType = imageMessage ? 'image' : 'video';
        const extension = imageMessage ? 'jpg' : 'mp4';

        const safeFolder = (from ?? 'unknown').replace(/@/g, '_');
        const folderPath = path.join('media', safeFolder);

        if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath, { recursive: true });
        }

        const filePath = path.join(folderPath, `${timestamp}.${extension}`);
        fs.writeFileSync(filePath, buffer);

        const caption = imageMessage?.caption || videoMessage?.caption;
        if (caption) {
            console.log(`✏️ Media caption from ${from}: ${caption}`);
        }

        console.log(`✅ ${mediaType.toUpperCase()} saved. FileLoc: ${filePath}, JID: ${from}`);

        return true; // handled
    } catch (err) {
        console.error(`❌ ${from} : media message not handled.`, err);
        return false; // not handled
    }
}