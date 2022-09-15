export const toBuffer = (ary: Uint8Array): ArrayBuffer => {
  return ary.buffer.slice(ary.byteOffset, ary.byteLength + ary.byteOffset);
}