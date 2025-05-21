"use client";
import { FC, useEffect, useRef, useState } from "react";

interface CupVideoProps {
  className?: string;
}

export const CupVideo: FC<CupVideoProps> = ({ className = "" }) => {
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedData = () => {
      setIsVideoLoaded(true);
    };

    video.addEventListener("loadeddata", handleLoadedData);
    return () => {
      video.removeEventListener("loadeddata", handleLoadedData);
    };
  }, []);

  return (
    <div
      className={`relative mx-auto aspect-square w-full ${className}`}
      style={{
        clipPath: "polygon(50% 2%, 92% 49%, 50% 98%, 8% 49%)",
        WebkitClipPath: "polygon(50% 2%, 92% 49%, 50% 98%, 8% 49%)",
        background: "var(--color-bg, #181c20)", // fallback background
      }}
    >
      {!isVideoLoaded && (
        <img
          src="https://metaculus-media.s3.us-west-2.amazonaws.com/first-frame.jpg"
          alt="Metaculus Cup Preview"
          className="w-full"
        />
      )}
      <video
        ref={videoRef}
        className={`w-full ${!isVideoLoaded ? "hidden" : ""}`}
        autoPlay
        loop
        muted
        playsInline
      >
        <source
          src="https://metaculus-media.s3.us-west-2.amazonaws.com/metaculus-cup-video-compressed.mp4"
          type="video/mp4"
        />
        Your browser does not support the video tag.
      </video>
    </div>
  );
};
