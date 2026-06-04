import { Command } from "./Command";
import { JoinImage } from "./commands/MemberJoinServer";
import { Ping } from "./commands/Ping";
import { ExampleWelcome } from "./commands/ExampleWelcome";

export const Commands: Command[] = [Ping, JoinImage, ExampleWelcome];