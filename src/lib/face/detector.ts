import * as faceapi from "face-api.js";
import type { RedactionArea } from "@/types/pdf";

let modelLoaded = false;
let modelLoadPromise: Promise<void> | null = null;

/**
 * Load the SSD MobileNet v1 face detection model (lazy, cached).
 */
export async function loadFaceDetectionModel(): Promise<void> {
  if (modelLoaded) return;
  if (modelLoadPromise) return modelLoadPromise;

  modelLoadPromise = (async () => {
    await faceapi.nets.ssdMobilenetv1.loadFromUri("/models");
    modelLoaded = true;
  })();

  return modelLoadPromise;
}

/**
 * Check if the face detection model is loaded.
 */
export function isFaceModelLoaded(): boolean {
  return modelLoaded;
}

let idCounter = 0;

/**
 * Detect faces in a canvas and return RedactionArea[] with bounding boxes.
 * The canvas coordinates are in the original image/page coordinate system.
 * If `scale` is provided, coordinates are divided by it to map back to original dimensions.
 */
export async function detectFacesInCanvas(
  canvas: HTMLCanvasElement,
  pageIndex: number,
  scale: number = 1
): Promise<RedactionArea[]> {
  await loadFaceDetectionModel();

  const detections = await faceapi.detectAllFaces(
    canvas,
    new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 })
  );

  return detections.map((det) => {
    const box = det.box;
    return {
      id: `face-${pageIndex}-${idCounter++}`,
      pageIndex,
      x: box.x / scale,
      y: box.y / scale,
      width: box.width / scale,
      height: box.height / scale,
      text: "",
      piiType: "face",
      blurMode: true,
      confirmed: false,
    };
  });
}
