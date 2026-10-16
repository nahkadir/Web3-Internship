import { useEffect, useRef } from "react";
import socket from "../services/socket";

// subscribe to a socket event; always calls the latest handler without resubscribing
export default function useSocketEvent(event, handler) {
  const ref = useRef(handler);
  useEffect(() => {
    ref.current = handler;
  });

  useEffect(() => {
    const listener = (...args) => ref.current(...args);
    socket.on(event, listener);
    return () => socket.off(event, listener);
  }, [event]);
}
