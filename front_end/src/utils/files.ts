import { isNil } from "lodash";

export function base64ToBlob(base64: string): Blob {
  const data = base64.split(",")[1];
  if (isNil(data)) {
    throw new Error("Invalid base64 string");
  }
  const byteString = atob(data);

  const mimeString = base64.split(",")[0]?.split(":")?.[1]?.split(";")?.[0];
  if (isNil(mimeString)) {
    throw new Error("Invalid base64 string");
  }

  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type: mimeString });
}
