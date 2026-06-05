import { readFileSync } from 'fs';
import { join } from 'path';
import ServerInfoModel from '../models/serverInfo';

function loadWordsFromFile(): string[] {
  const filePath = join(process.cwd(), 'public', 'assets', 'word.txt');
  return readFileSync(filePath, 'utf-8')
    .split('\n')
    .map((w) => w.trim())
    .filter((w) => w.length > 0);
}

async function seedWordsIfEmpty(serverId: string): Promise<string[]> {
  const doc = await ServerInfoModel.findOne({ serverId });
  if (doc && doc.words && doc.words.length > 0) {
    return doc.words;
  }
  const words = loadWordsFromFile();
  await ServerInfoModel.findOneAndUpdate(
    { serverId },
    { $set: { words, wordMode: 'random' } },
    { upsert: true, new: true }
  );
  return words;
}

export async function getWordForServer(serverId: string): Promise<string> {
  const doc = await ServerInfoModel.findOne({ serverId });

  if (!doc || !doc.words || doc.words.length === 0) {
    const words = await seedWordsIfEmpty(serverId);
    return words[Math.floor(Math.random() * words.length)];
  }

  if (doc.wordMode === 'fixed' && doc.fixedWord) {
    return doc.fixedWord;
  }

  return doc.words[Math.floor(Math.random() * doc.words.length)];
}

export async function addWord(serverId: string, word: string): Promise<void> {
  await ServerInfoModel.findOneAndUpdate(
    { serverId },
    { $addToSet: { words: word } },
    { upsert: true }
  );
}

export async function removeWord(serverId: string, word: string): Promise<void> {
  await ServerInfoModel.findOneAndUpdate(
    { serverId },
    { $pull: { words: word } }
  );
}

export async function listWords(serverId: string): Promise<string[]> {
  const words = await seedWordsIfEmpty(serverId);
  return words;
}

export async function setWordMode(
  serverId: string,
  mode: 'random' | 'fixed',
  fixedWord?: string
): Promise<void> {
  await ServerInfoModel.findOneAndUpdate(
    { serverId },
    { $set: { wordMode: mode, fixedWord: fixedWord ?? null } },
    { upsert: true }
  );
}
