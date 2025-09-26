import { clsx } from "clsx";

export function cn(...inputs: Array<string | number | null | undefined | false>) {
  return clsx(inputs);
}
