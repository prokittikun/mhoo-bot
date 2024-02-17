import { Command } from "./Command";
import { JoinImage } from "./commands/MemberJoinServer";
import { Ping } from "./commands/Ping";

export const Commands: Command[] = [Ping, JoinImage];