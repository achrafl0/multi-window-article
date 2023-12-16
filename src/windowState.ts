import { WindowState } from "./types";

export const getCurrentWindowState = (): WindowState => ({
  screenX: window.screenX,
  screenY: window.screenY,
  width: window.innerWidth,
  height: window.innerHeight,
});

export const didWindowChange = ({
  newWindow,
  oldWindow,
}: {
  newWindow: WindowState;
  oldWindow?: WindowState;
}) => {
  if (!oldWindow) {
    return true;
  }
  const result =
    oldWindow.height !== newWindow.height ||
    oldWindow.width !== newWindow.width ||
    oldWindow.screenX !== newWindow.screenX ||
    oldWindow.screenY !== newWindow.screenY;

  return result;
};

export const getWindowCenter = (win: WindowState) => ({
  x: win.width / 2,
  y: win.height / 2,
});
