import * as React from "react";
import { cn } from "./lib/utils";

interface WebcamProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function Webcam({ className, ...props }: WebcamProps) {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [isStreaming, setIsStreaming] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const startCamera = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user"
        },
        audio: false
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsStreaming(true);
      }

      // Handle stream end
      stream.getVideoTracks()[0].onended = () => {
        setIsStreaming(false);
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
        // Automatically restart camera when stream ends
        setTimeout(startCamera, 1000);
      };
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Failed to access camera");
      // Retry after 2 seconds if there's an error
      setTimeout(startCamera, 2000);
    }
  };

  // Start camera immediately when component mounts
  React.useEffect(() => {
    startCamera();

    // Cleanup function
    return () => {
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div
      className={cn(
        "fixed top-8 right-4 w-60 h-42 rounded-[0.8rem] overflow-hidden shadow-lg border-1 border-border bg-background",
        className
      )}
      {...props}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
      />
      {!isStreaming && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-[2rem]">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              {error || "Starting camera..."}
            </p>
            <button
              onClick={startCamera}
              className="mt-2 px-3 py-1 text-sm bg-primary text-primary-foreground rounded-full hover:bg-primary/90"
            >
              Start Camera
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 