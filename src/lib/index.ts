import {PuzzleJs} from "./puzzle";

declare global {
  interface Window {
    PuzzleJs: PuzzleJs;
  }
}

if (typeof window !== "undefined") {
 window.PuzzleJs = new PuzzleJs();
}

console.log('Works');
