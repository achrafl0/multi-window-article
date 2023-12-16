import { WindowState, WorkerMessage } from "./types";
import { didWindowChange, getCurrentWindowState } from "./windowState";

type StateWithId = { id: number; windowState: WindowState };
type OnSyncCallbackFunction = (allWindows: StateWithId[]) => void;

export class WindowWorkerHandler {
  windows: StateWithId[] = [];
  currentWindow: WindowState = getCurrentWindowState();
  id: number;
  onSyncCallbacks: OnSyncCallbackFunction[] = [];
  worker: SharedWorker;

  constructor() {
    this.worker = new SharedWorker(new URL("worker.ts", import.meta.url));
    const connectedMessage: WorkerMessage = {
      action: "connected",
      payload: { state: this.currentWindow },
    };
    this.onSyncCallback = this.onSyncCallback.bind(this);
    this.worker.port.postMessage(connectedMessage);
    this.worker.port.onmessage = (ev: MessageEvent<WorkerMessage>) => {
      const msg = ev.data;
      switch (msg.action) {
        case "attributedId": {
          this.id = msg.payload.id;
          break;
        }
        case "sync": {
          this.onSyncCallback(msg.payload.allWindows);
          break;
        }
      }
    };
    window.addEventListener("beforeunload", () => {
      this.worker.port.postMessage({
        action: "windowUnloaded",
        payload: { id: this.id },
      } satisfies WorkerMessage);
    });
  }

  private onSyncCallback(allWindows: StateWithId[]) {
    this.currentWindow = getCurrentWindowState();
    this.windows = allWindows;
    this.onSyncCallbacks.forEach((cb) => cb(allWindows));
  }

  onSync(cb: OnSyncCallbackFunction) {
    // TODO : send back the unregister
    this.onSyncCallbacks.push(cb);
  }

  windowHasChanged() {
    const newWindow = getCurrentWindowState();
    const oldWindow = this.currentWindow;
    if (
      didWindowChange({
        newWindow,
        oldWindow,
      })
    ) {
      this.currentWindow = newWindow;
      this.worker.port.postMessage({
        action: "windowStateChanged",
        payload: { id: this.id, newWindow, oldWindow },
      } satisfies WorkerMessage);
    }
  }
}
