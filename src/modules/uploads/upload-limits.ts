const DEFAULT_IMAGE_MAX_MB = 25;

function toPositiveNumber(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

export const uploadImageMaxMb =
  toPositiveNumber(process.env.UPLOAD_IMAGE_MAX_MB) ?? DEFAULT_IMAGE_MAX_MB;

export const uploadImageMaxBytes = Math.floor(uploadImageMaxMb * 1024 * 1024);

export const uploadLimits = {
  fileSize: uploadImageMaxBytes,
};
