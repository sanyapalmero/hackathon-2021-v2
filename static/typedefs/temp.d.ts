import CallingClient from "../ts/client";

declare global {
  interface Window {
    callme: () => void;
  }
}
