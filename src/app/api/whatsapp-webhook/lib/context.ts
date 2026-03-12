import type { User } from "@prisma/client";

export type CommandContext = {
  user: User;
  message: string;
  lower: string;
  trimmedMessage: string;
  command: string;
  args: string[];
  fmt: (amount: number) => string;
  isGroup: boolean;
};
