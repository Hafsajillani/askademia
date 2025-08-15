import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import { Base64 } from 'js-base64';

interface TranscriptionMessage {
  text: string;
  sender: "User" | "Gemini";
  finished: boolean | null;
}

interface TextMessage {
  text: string;
  sender: "Gemini";
}

interface WebSocketContextType {
  sendMessage: (message: any) => void;
  sendMediaChunk: (chunk: MediaChunk) => void;
  lastTranscription: TranscriptionMessage | null;
  lastTextMessage: TextMessage | null;
  lastAudioData: string | null;
  isConnected: boolean;
  playbackAudioLevel: number;
  error: string | null;
}

interface MediaChunk {
  mime_type: string;
  data: string;
}

interface AudioChunkBuffer {
  data: ArrayBuffer[];
  startTimestamp: number;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

const RECONNECT_TIMEOUT = 2000;
const CONNECTION_TIMEOUT = 30000;

export const WebSocketProvider: React.FC<{ children: React.ReactNode; url: string }> = ({
  children,
  url,
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [playbackAudioLevel, setPlaybackAudioLevel] = useState(0);
  const [lastTranscription, setLastTranscription] = useState<TranscriptionMessage | null>(null);
  const [lastTextMessage, setLastTextMessage] = useState<TextMessage | null>(null);
  const [lastAudioData, setLastAudioData] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | undefined>();
  const connectionTimeoutRef = useRef<NodeJS.Timeout | undefined>();
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioBufferQueueRef = useRef<AudioChunkBuffer[]>([]);
  const reconnectAttemptsRef = useRef(0);
  const currentAudioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext({ sampleRate: 24000 });
    }
    return audioContextRef.current;
  }, []);

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('Sending message:', message);
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('Cannot send message: WebSocket is not open');
      setError("WebSocket not connected");
    }
  }, []);

  const reconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    const backoffTime = Math.min(30000, RECONNECT_TIMEOUT * (reconnectAttemptsRef.current || 1));
    console.log(`Scheduling reconnect in ${backoffTime}ms`);

    reconnectTimeoutRef.current = setTimeout(() => {
      reconnectAttemptsRef.current = (reconnectAttemptsRef.current || 0) + 1;
      connect();
    }, backoffTime);
  }, []);

  const connect = useCallback(() => {
    if (wsRef.current && (wsRef.current.readyState === WebSocket.CONNECTING || wsRef.current.readyState === WebSocket.OPEN)) {
      console.log("WebSocket already connecting or connected");
      return;
    }

    try {
      console.log(`Connecting to WebSocket: ${url}`);
      const ws = new WebSocket(url);
      wsRef.current = ws;

      connectionTimeoutRef.current = setTimeout(() => {
        if (ws.readyState !== WebSocket.OPEN) {
          console.warn(`Connection timeout after ${CONNECTION_TIMEOUT}ms`);
          ws.close();
          reconnect();
        }
      }, CONNECTION_TIMEOUT);

      ws.binaryType = 'arraybuffer';

      ws.onopen = () => {
        setIsConnected(true);
        setError(null);
        clearTimeout(connectionTimeoutRef.current);
        console.log("WebSocket connected, sending initial setup");
        setTimeout(() => {
          sendMessage({
            response_modalities: ["AUDIO", "TEXT"],
            speech_config: {
              voice_config: { prebuilt_voice_config: { voice_name: "Kore" } },
              language_code: "en-US",
            },
            system_instruction: "You are a helpful assistant.",
            output_audio_transcription: {},
          });
        }, 1000);
      };

      ws.onclose = (event) => {
        setIsConnected(false);
        const errorMessage = `WebSocket closed: code=${event.code}, reason=${event.reason}`;
        setError(errorMessage);
        console.log(errorMessage);
        
        if (event.code !== 1000) {
          reconnect();
        }
      };

      ws.onerror = (error) => {
        const errorMessage = "WebSocket error occurred";
        setError(errorMessage);
        console.error('WebSocket error:', error);
        ws.close();
      };

      ws.onmessage = async (event) => {
        try {
          if (typeof event.data === 'string') {
            const data = JSON.parse(event.data);
            console.log('Received message:', data);

            if (data.error) {
              setError(data.error);
              if (data.error.includes("session not found") || data.error.includes("policy violation")) {
                console.log("Session error detected, attempting to reconnect...");
                ws.close();
                reconnect();
                return;
              }
              return;
            }

            if (data.transcription) {
              setLastTranscription({
                text: data.transcription.text,
                sender: data.transcription.sender,
                finished: data.transcription.finished,
              });
            }

            if (data.text) {
              setLastTextMessage({
                text: data.text,
                sender: "Gemini",
              });
            }

            if (data.interrupted) {
              console.log('Received interruption signal');
              if (currentAudioSourceRef.current) {
                currentAudioSourceRef.current.stop();
                currentAudioSourceRef.current = null;
              }
              audioBufferQueueRef.current = [];
              setPlaybackAudioLevel(0);
            }

            if (data.audio) {
              setLastAudioData(data.audio);
              try {
                const audioBuffer = Base64.toUint8Array(data.audio);
                audioBufferQueueRef.current.push({
                  data: [audioBuffer.buffer],
                  startTimestamp: Date.now(),
                });
              } catch (error) {
                console.error('Error decoding audio data:', error);
                setError("Failed to decode audio data");
              }
            }
          } else {
            console.warn('Received non-JSON message:', event.data);
          }
        } catch (error) {
          console.error('Error handling message:', error);
          setError("Error processing server message");
        }
      };
    } catch (error) {
      console.error('Error creating WebSocket:', error);
      setError("Failed to create WebSocket connection");
      reconnect();
    }
  }, [url, reconnect, sendMessage]);

  const playAudioChunk = useCallback((audioBuffers: ArrayBuffer[]): Promise<void> => {
    return new Promise((resolve, reject) => {
      try {
        const ctx = initAudioContext();
        const totalLength = audioBuffers.reduce((acc, buffer) => acc + new Int16Array(buffer).length, 0);

        if (totalLength === 0) {
          return resolve();
        }

        const combinedInt16Array = new Int16Array(totalLength);
        let offset = 0;

        audioBuffers.forEach(buffer => {
          const int16Data = new Int16Array(buffer);
          combinedInt16Array.set(int16Data, offset);
          offset += int16Data.length;
        });

        const audioBuffer = ctx.createBuffer(1, totalLength, 24000);
        const channelData = audioBuffer.getChannelData(0);

        for (let i = 0; i < totalLength; i++) {
          channelData[i] = combinedInt16Array[i] / 32768.0;
        }

        const fadeSamples = Math.min(200, totalLength / 8);
        for (let i = 0; i < fadeSamples; i++) {
          const factor = Math.sin((i / fadeSamples) * Math.PI / 2);
          channelData[i] *= factor;
          channelData[totalLength - 1 - i] *= factor;
        }

        const source = ctx.createBufferSource();
        currentAudioSourceRef.current = source;
        const gainNode = ctx.createGain();
        gainNode.gain.value = 1.5;

        source.buffer = audioBuffer;
        source.connect(gainNode);
        gainNode.connect(ctx.destination);

        source.start();

        const simulateLevel = () => {
          const randomLevel = 20 + Math.floor(Math.random() * 20);
          setPlaybackAudioLevel(randomLevel);
        };

        const levelInterval = setInterval(simulateLevel, 200);

        source.onended = () => {
          clearInterval(levelInterval);
          setPlaybackAudioLevel(0);
          currentAudioSourceRef.current = null;
          resolve();
        };
      } catch (error) {
        console.error('Error playing audio:', error);
        setError("Error playing audio");
        reject(error);
      }
    });
  }, [initAudioContext]);

  useEffect(() => {
    let isPlaybackActive = false;

    const playNextWhenReady = async () => {
      if (isPlaybackActive || audioBufferQueueRef.current.length === 0) {
        return;
      }

      isPlaybackActive = true;

      try {
        const allChunks = [...audioBufferQueueRef.current];
        audioBufferQueueRef.current = [];

        const allBuffers: ArrayBuffer[] = [];
        allChunks.forEach(chunk => {
          allBuffers.push(...chunk.data);
        });

        await playAudioChunk(allBuffers);

        if (audioBufferQueueRef.current.length > 0) {
          playNextWhenReady();
        }
      } catch (error) {
        console.error("Error in audio playback:", error);
        setError("Audio playback failed");
      } finally {
        isPlaybackActive = false;
      }
    };

    const checkInterval = setInterval(() => {
      if (audioBufferQueueRef.current.length > 0 && !isPlaybackActive) {
        playNextWhenReady();
      }
    }, 50);

    return () => clearInterval(checkInterval);
  }, [playAudioChunk]);

  useEffect(() => {
    connect();
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
      }
    };
  }, [connect]);

  useEffect(() => {
    if (isConnected) {
      reconnectAttemptsRef.current = 0;
    }
  }, [isConnected]);

  const sendMediaChunk = useCallback((chunk: MediaChunk) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const message = {
        realtime_input: {
          media_chunks: [chunk],
        },
      };
      console.log('Sending media chunk:', message);
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('Cannot send media chunk: WebSocket is not open');
      setError("WebSocket not connected");
    }
  }, []);

  return (
    <WebSocketContext.Provider
      value={{
        sendMessage,
        sendMediaChunk,
        lastTranscription,
        lastTextMessage,
        lastAudioData,
        isConnected,
        playbackAudioLevel,
        error,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error("useWebSocket must be used within a WebSocketProvider");
  }
  return context;
};