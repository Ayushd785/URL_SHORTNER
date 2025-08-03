import { nanoid } from "nanoid";

export const generateCode = (): string => {
  return nanoid(7);
};
