import { Command } from "./Command";
import { JoinImage } from "./commands/MemberJoinServer";
import { Ping } from "./commands/Ping";
import { ExampleWelcome } from "./commands/ExampleWelcome";
import { AddWord } from "./commands/AddWord";
import { RemoveWord } from "./commands/RemoveWord";
import { EditWord } from "./commands/EditWord";
import { ListWords } from "./commands/ListWords";
import { SetWordMode } from "./commands/SetWordMode";
import { Reset } from "./commands/Reset";
import { SetText } from "./commands/SetText";

export const Commands: Command[] = [
  Ping,
  JoinImage,
  ExampleWelcome,
  AddWord,
  RemoveWord,
  EditWord,
  ListWords,
  SetWordMode,
  SetText,
  Reset,
];
