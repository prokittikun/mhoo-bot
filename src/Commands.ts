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
import { Help } from "./commands/Help";
import { Invite } from "./commands/Invite";
import { Antispam } from "./commands/Antispam";
import { Val } from "./commands/Val";
import { Music } from "./commands/Music";

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
  Help,
  Invite,
  Antispam,
  Val,
  Music,
  Reset,
];
