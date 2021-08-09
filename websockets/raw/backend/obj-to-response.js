export default function objToResponse(obj) {
  const string = JSON.stringify(obj);
  const stringBytes = Buffer.byteLength(string);
  // we're only doing two frames
  const lengthByteCount = stringBytes < 126 ? 0 : 2;
  const payloadLength = lengthByteCount === 0 ? stringBytes : 126;
  const buffer = Buffer.alloc(2 + lengthByteCount + stringBytes);

  buffer.writeUInt8(0b10000001, 0);
  buffer.writeUInt8(payloadLength, 1);

  let payloadOffset = 2;
  if (lengthByteCount > 0) {
    buffer.writeUInt16BE(stringBytes, 2);
    payloadOffset += lengthByteCount;
  }

  buffer.write(string, payloadOffset);
  return buffer;
}
