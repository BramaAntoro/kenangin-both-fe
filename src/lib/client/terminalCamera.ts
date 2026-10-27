let terminalCameraStream: MediaStream | null = null;

export function getTerminalCameraStream() {
  if (terminalCameraStream?.getVideoTracks().some((track) => track.readyState === "live")) {
    return terminalCameraStream;
  }
  terminalCameraStream = null;
  return null;
}

export async function startTerminalCamera() {
  const existingStream = getTerminalCameraStream();
  if (existingStream) return existingStream;

  terminalCameraStream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: "user" },
    audio: false,
  });
  return terminalCameraStream;
}
