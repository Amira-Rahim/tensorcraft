"use client";

import { useState } from "react";
import {
  WORKED_PACKET,
  WORKED_EXCERPT,
  transformPacket,
} from "../../components/mdx/channel-layout-data";

const reshaped = transformPacket(WORKED_PACKET, "reshape");
const transposed = transformPacket(WORKED_PACKET, "transpose");

export function ReadingComparison() {
  const [selected, setSelected] = useState(1);
  const moment = Math.floor(selected / WORKED_EXCERPT.sensorIds.length);
  const sensor = selected % WORKED_EXCERPT.sensorIds.length;
  const value = WORKED_PACKET[moment][sensor];

  return (
    <figure className="my-8 border-y border-border py-6">
      <p className="mb-5 leading-relaxed text-text-muted">
        Select any reading in the input. Its matching cell stays highlighted in
        both outputs. The comparison uses JavaScript array operations for this
        fixed example. The TensorFlow.js code below produces the same values.
      </p>
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="min-w-0 overflow-x-auto">
          <table className="w-full border-collapse text-center font-mono text-sm">
            <caption className="mb-3 text-left font-bold text-text-primary">
              Input: [3, 4]
            </caption>
            <thead>
              <tr>
                <th scope="col" className="p-1 text-left text-xs font-normal">
                  Local moment
                </th>
                {WORKED_EXCERPT.sensorIds.map((id) => (
                  <th key={id} scope="col" className="p-1">
                    {id}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {WORKED_PACKET.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  <th scope="row" className="p-1 font-normal">
                    {rowIndex}
                  </th>
                  {row.map((reading, colIndex) => {
                    const index = rowIndex * row.length + colIndex;
                    return (
                      <td key={colIndex} className="p-0.5">
                        <button
                          type="button"
                          aria-label={`Sensor ${WORKED_EXCERPT.sensorIds[colIndex]}, local moment ${rowIndex}: ${reading}`}
                          aria-pressed={selected === index}
                          onClick={() => setSelected(index)}
                          className={`min-h-11 min-w-11 border border-interactive px-2 focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 ${selected === index ? "bg-primary font-bold text-on-primary" : "bg-page text-text-primary hover:bg-surface-raised"}`}
                        >
                          {reading}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {(["reshape", "transpose"] as const).map((operation) => {
          const output = operation === "reshape" ? reshaped : transposed;
          return (
            <div key={operation} className="min-w-0 overflow-x-auto">
              <table className="w-full border-collapse text-center font-mono text-sm">
                <caption className="mb-3 text-left font-bold text-text-primary">
                  {operation === "reshape" ? "reshape([4, 3])" : "transpose()"}:
                  [4, 3]
                </caption>
                <thead>
                  <tr>
                    <th
                      scope="col"
                      className="p-1 text-left text-xs font-normal"
                    >
                      {operation === "transpose" ? "Sensor" : "Row"}
                    </th>
                    {[0, 1, 2].map((index) => (
                      <th key={index} scope="col" className="p-1">
                        {index}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {output.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      <th scope="row" className="p-1 font-normal">
                        {operation === "transpose"
                          ? WORKED_EXCERPT.sensorIds[rowIndex]
                          : rowIndex}
                      </th>
                      {row.map((reading, colIndex) => {
                        const sourceIndex =
                          operation === "reshape"
                            ? rowIndex * row.length + colIndex
                            : colIndex * WORKED_EXCERPT.sensorIds.length +
                              rowIndex;
                        return (
                          <td key={colIndex} className="p-0.5">
                            <span
                              className={`flex min-h-11 min-w-11 items-center justify-center border border-border px-2 ${sourceIndex === selected ? "bg-primary font-bold text-on-primary" : "text-text-primary"}`}
                            >
                              {reading}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>
      <p role="status" className="mt-5 leading-relaxed">
        Sensor {WORKED_EXCERPT.sensorIds[sensor]} at local moment {moment} has
        value {value}. Reshape puts it at row {Math.floor(selected / 3)}, column{" "}
        {selected % 3}. Transpose puts it at sensor row{" "}
        {WORKED_EXCERPT.sensorIds[sensor]}, moment column {moment}.
      </p>
      <figcaption className="mt-3 text-sm leading-relaxed text-text-muted">
        Selected readings from Deep Orbit&apos;s fictional recording. Both
        operations return four rows and three columns. Only transpose groups
        each selected sensor&apos;s readings in local moment order.
      </figcaption>
    </figure>
  );
}
