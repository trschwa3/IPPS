import React from "react";

interface SplashScreenProps {
  onFinish: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  return (
    <div
      style={{
        position: "fixed", // fixed to cover the whole viewport
        top: 0,
        left: 0,
        width: "100%",
        height: "100vh",
        backgroundColor: "white", // force white background
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999, // high z-index to cover all other content
      }}
    >
      <video
        style={{
          maxWidth: "100%",
          maxHeight: "100%",
          objectFit: "cover",
        }}
        autoPlay
        muted
        onEnded={onFinish}
      >
        <source src="/IPPS/IPPS_Animated.mp4" type="video/mp4" />
        Your browser does not support HTML5 video.
      </video>
      <button
        onClick={onFinish}
        style={{
          position: "absolute",
          top: "10px",
          right: "10px",
          background: "rgba(255,255,255,1)",
          border: "none",
          padding: "0.5rem 1rem",
          cursor: "pointer",
          zIndex: 10000,
        }}
      >
        Skip
      </button>
    </div>
  );
};

export default SplashScreen;
