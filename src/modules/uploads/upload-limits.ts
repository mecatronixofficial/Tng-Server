const DEFAULT_IMAGE_MAX_MB = 60;
const DEFAULT_IMAGE_MAX_FILES = 20;

function toPositiveNumber(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

export const uploadImageMaxMb =
  toPositiveNumber(process.env.UPLOAD_IMAGE_MAX_MB) ?? DEFAULT_IMAGE_MAX_MB;

export const uploadImageMaxBytes = Math.floor(uploadImageMaxMb * 1024 * 1024);
export const uploadImageMaxFiles =
  Math.floor(toPositiveNumber(process.env.UPLOAD_IMAGE_MAX_FILES) ?? DEFAULT_IMAGE_MAX_FILES);

export const uploadLimits = {
  fileSize: uploadImageMaxBytes,
  files: uploadImageMaxFiles,
};
