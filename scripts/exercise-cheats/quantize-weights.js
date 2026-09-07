// Lacks the whole point of quantization: it computes the min-max scaling but
// never rounds, so the stored values are full-precision floats and nothing is
// ever squeezed onto the 256 integer buckets. scale and zeroPoint are correct,
// so the round trip returns the originals exactly and the accuracy price the
// lesson is about is never paid.
function quantize(weights) {
  const min = Math.min(...weights);
  const max = Math.max(...weights);
  const scale = (max - min) / 255;
  const zeroPoint = Math.round(-min / scale);

  const quantized = weights.map((w) => (w - min) / scale);

  return { quantized, scale, zeroPoint };
}

function dequantize(result) {
  return result.quantized.map((q) => (q - result.zeroPoint) * result.scale);
}
