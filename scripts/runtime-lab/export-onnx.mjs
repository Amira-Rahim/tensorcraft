// Exact export of the shipped Dense/ReLU/Dense/ReLU/Dense/Sigmoid fixture.
// This is deliberately not a general TFJS-to-ONNX converter.
import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import proto from "onnx-proto";
const { onnx } = proto;

export async function exportOnnx(modelDir, destination) {
  const manifestBytes = await readFile(`${modelDir}/model.json`);
  const manifest = JSON.parse(manifestBytes);
  const layers = manifest.modelTopology.config.layers;
  if (
    layers
      .map((l) => `${l.class_name}:${l.config.units}:${l.config.activation}`)
      .join(",") !== "Dense:32:relu,Dense:16:relu,Dense:1:sigmoid"
  )
    throw Error("Unexpected fixture architecture");
  const group = manifest.weightsManifest[0];
  if (
    manifest.weightsManifest.length !== 1 ||
    group.weights.some((w) => w.dtype !== "float32" || w.quantization)
  )
    throw Error("Exporter requires the unquantized float32 fixture");
  const weights = Buffer.concat(
    await Promise.all(group.paths.map((p) => readFile(`${modelDir}/${p}`))),
  );
  let offset = 0;
  const initializer = group.weights.map((w) => {
    const bytes = 4 * w.shape.reduce((a, b) => a * b, 1);
    const tensor = {
      name: w.name,
      dataType: 1,
      dims: w.shape,
      rawData: weights.subarray(offset, offset + bytes),
    };
    offset += bytes;
    return tensor;
  });
  if (offset !== weights.length) throw Error("Weight byte length mismatch");
  const node = [];
  for (let i = 0; i < layers.length; i++) {
    const name = layers[i].config.name;
    node.push({
      opType: "Gemm",
      input: [
        i ? `activation${i - 1}` : "input",
        `${name}/kernel`,
        `${name}/bias`,
      ],
      output: [`dense${i}`],
    });
    node.push({
      opType: i === 2 ? "Sigmoid" : "Relu",
      input: [`dense${i}`],
      output: [i === 2 ? "output" : `activation${i}`],
    });
  }
  const value = (name, dims) => ({
    name,
    type: {
      tensorType: {
        elemType: 1,
        shape: { dim: dims.map((dimValue) => ({ dimValue })) },
      },
    },
  });
  const model = {
    irVersion: 8,
    producerName: "tensorcraft-runtime-lab",
    producerVersion: "1",
    opsetImport: [{ domain: "", version: 13 }],
    graph: {
      name: "deep-scan-frozen",
      node,
      initializer,
      input: [value("input", [1, 3])],
      output: [value("output", [1, 1])],
    },
  };
  const error = onnx.ModelProto.verify(model);
  if (error) throw Error(error);
  const bytes = onnx.ModelProto.encode(onnx.ModelProto.create(model)).finish();
  await writeFile(destination, bytes);
  const hash = (b) => createHash("sha256").update(b).digest("hex");
  return {
    manifestSha256: hash(manifestBytes),
    weightsSha256: hash(weights),
    onnxSha256: hash(bytes),
    weightBytes: weights.length,
    onnxBytes: bytes.length,
  };
}
