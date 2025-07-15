import { WASocket, proto } from '@whiskeysockets/baileys'
import { CommandFunction } from '../../types/command'
// Importing commands
import help from '../../commands/help';
import sticker from '../../commands/sticker';

const commands: Record<string, CommandFunction> = {
  help,
  sticker,
};

export default async function commandHandler(
    sock: WASocket,
    msg: proto.IWebMessageInfo
): Promise<boolean> {
    const from = msg.key.remoteJid;
    const text =
        msg.message?.conversation ||
        msg.message?.extendedTextMessage?.text ||
        msg.message?.imageMessage?.caption ||
        msg.message?.videoMessage?.caption;

    if (!text?.startsWith('/')) {
        console.warn(`${from} : message does not start with a command`);
        return false; // not handled
    }

    const [cmd, ...args] = text.trim().slice(1).split(/\s+/);
    const command = commands[cmd.toLowerCase()];
    if (!command) {
        console.warn(`${from} : Unknown commmand: ${cmd}`);
        await sock.sendMessage(msg.key.remoteJid!,{
            text: `❌Unknown command: ${cmd}. \nType /help for available commands.`
        }, { quoted: msg });
        return true; // handled
    }
    return await command(sock, msg, args);
}