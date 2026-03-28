import { useEffect, useRef, useState } from "react";
import { FaceMesh } from "@mediapipe/face_mesh";
import { Camera } from "@mediapipe/camera_utils";

export default function EyeTracker({ onMetricsUpdate }) {
  const videoRef = useRef(null);
  const faceMeshRef = useRef(null);
  const cameraRef = useRef(null);

  const [metrics, setMetrics] = useState({
    totalFrames: 0,
    centerFrames: 0,
  });

  useEffect(() => {
    if (!videoRef.current) return;

    const faceMesh = new FaceMesh({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
    });

    faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.6,
      minTrackingConfidence: 0.6,
    });

    faceMesh.onResults((results) => {
      if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0)
        return;

      const landmarks = results.multiFaceLandmarks[0];

      const leftIris = landmarks[468];
      const rightIris = landmarks[473];

      const leftEyeOuter = landmarks[33];
      const leftEyeInner = landmarks[133];

      const rightEyeInner = landmarks[362];
      const rightEyeOuter = landmarks[263];

      const forehead = landmarks[10];
      const chin = landmarks[152];
      const noseTip = landmarks[1];

      const leftEyeWidth = leftEyeInner.x - leftEyeOuter.x;
      const rightEyeWidth = rightEyeOuter.x - rightEyeInner.x;

      const leftIrisOffset =
        (leftIris.x - leftEyeOuter.x) / leftEyeWidth;

      const rightIrisOffset =
        (rightIris.x - rightEyeInner.x) / rightEyeWidth;

      const horizontalCentered =
        leftIrisOffset > 0.30 &&
        leftIrisOffset < 0.70 &&
        rightIrisOffset > 0.30 &&
        rightIrisOffset < 0.70;

      const eyeMidY =
        (leftEyeOuter.y + rightEyeOuter.y) / 2;

      const verticalOffsetLeft =
        Math.abs(leftIris.y - eyeMidY);

      const verticalOffsetRight =
        Math.abs(rightIris.y - eyeMidY);

      const verticalCentered =
        verticalOffsetLeft < 0.025 &&
        verticalOffsetRight < 0.025;

      const faceHeight =
        Math.abs(forehead.y - chin.y);

      const noseCenterOffset =
        Math.abs(noseTip.x - 0.5);

      const headStable =
        faceHeight > 0.15 &&
        noseCenterOffset < 0.15;

      const lookingCenter =
        horizontalCentered &&
        verticalCentered &&
        headStable;

      setMetrics((prev) => {
        const newTotal = prev.totalFrames + 1;

        const newCenter = lookingCenter
          ? prev.centerFrames + 1
          : prev.centerFrames;

        return {
          totalFrames: newTotal,
          centerFrames: newCenter,
        };
      });
    });

    const camera = new Camera(videoRef.current, {
      onFrame: async () => {
        if (faceMeshRef.current && videoRef.current) {
          await faceMeshRef.current.send({ image: videoRef.current });
        }
      },
      width: 640,
      height: 480,
    });

    faceMeshRef.current = faceMesh;
    cameraRef.current = camera;

    camera.start();

    return () => {
      cameraRef.current?.stop();
      faceMeshRef.current?.close();
    };
  }, []);

  useEffect(() => {
    if (metrics.totalFrames > 0) {
      onMetricsUpdate(metrics);
    }
  }, [metrics]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted
      style={{ display: "none" }}
    />
  );
}