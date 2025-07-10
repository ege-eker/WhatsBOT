import {WASocket, proto} from "@whiskeysockets/baileys";

export default async function textHandler(
    sock: WASocket,
    msg: proto.IWebMessageInfo
): Promise<boolean> {
    const from = msg.key.remoteJid;

    if (!msg.message || (!msg.message.conversation && !msg.message.extendedTextMessage?.text)) {
        console.warn(`${from} : Not a text message`);
        return false; // not handled
    }

    const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text;

    if (!text) {
        console.warn(`${from} : Empty text message`);
        return false; // not handled
    }

    console.log(`${from} : Text message: ${text}`);
    return true; // handled
    }