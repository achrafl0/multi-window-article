import { WindowState } from "./types";
import { getWindowCenter } from "./windowState";
import { WindowWorkerHandler } from "./workerHandler";

type Coordinates = {
  x: number;
  y: number;
};

const baseChange = ({
  currentWindowOffset,
  targetWindowOffset,
  targetPosition,
}: {
  currentWindowOffset: Coordinates;
  targetWindowOffset: Coordinates;
  targetPosition: Coordinates;
}) => {
  const monitorCoordinate = {
    x: targetPosition.x + targetWindowOffset.x,
    y: targetPosition.y + targetWindowOffset.y,
  };

  const currentWindowCoordinate = {
    x: monitorCoordinate.x - currentWindowOffset.x,
    y: monitorCoordinate.y - currentWindowOffset.y,
  };

  return currentWindowCoordinate;
};

const drawMainCircle = (
  ctx: CanvasRenderingContext2D | null,
  center: Coordinates
) => {
  const { x, y } = center;
  ctx!.strokeStyle = "#eeeeee";
  ctx!.lineWidth = 10;
  ctx!.beginPath();
  ctx!.arc(x, y, 100, 0, Math.PI * 2, false);
  ctx!.stroke();
  ctx!.closePath();
};

const drawConnectingLine = ({
  ctx,
  hostWindow,
  targetWindow,
}: {
  ctx: CanvasRenderingContext2D | null;
  hostWindow: WindowState;
  targetWindow: WindowState;
}) => {
  ctx!.strokeStyle = "#ff0000";
  ctx!.lineCap = "round";
  const currentWindowOffset: Coordinates = {
    x: hostWindow.screenX,
    y: hostWindow.screenY,
  };
  const targetWindowOffset: Coordinates = {
    x: targetWindow.screenX,
    y: targetWindow.screenY,
  };
  const origin = getWindowCenter(hostWindow);
  const target = getWindowCenter(targetWindow);

  const targetWithBaseChange = baseChange({
    currentWindowOffset,
    targetWindowOffset,
    targetPosition: target,
  });

  ctx!.strokeStyle = "#ff0000";
  ctx!.lineCap = "round";
  ctx!.beginPath();
  ctx!.moveTo(origin.x, origin.y);
  ctx!.lineTo(targetWithBaseChange.x, targetWithBaseChange.y);
  ctx!.stroke();
  ctx!.closePath();
};

function main() {
  const workerHandler = new WindowWorkerHandler();
  const canvas = document.querySelector<HTMLCanvasElement>("#canvas")!;
  if (!canvas) {
    console.error("Canvas element not found");
    return;
  }
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return;
  }
  // Function to update canvas size and redraw
  function updateCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const currentWindow = workerHandler.currentWindow;
    const currentId = workerHandler.id;
    const center = getWindowCenter(currentWindow);
    ctx?.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas
    drawMainCircle(ctx, center);
    workerHandler.windows
      .filter((w) => w.id !== currentId)
      .forEach(({ windowState: targetWindow }) => {
        drawConnectingLine({
          ctx,
          hostWindow: workerHandler.currentWindow,
          targetWindow,
        });
      });
  }
  updateCanvas();
  window.addEventListener("resize", updateCanvas);

  workerHandler.onSync((windows) => {
    updateCanvas();
  });

  setInterval(() => {
    workerHandler.windowHasChanged();
  }, 100);
}

main();
