import { describe, it, expect, vi } from "vitest";
import { resizeImage } from "../resize-image";

describe("resizeImage", () => {
  it("rejects non-image MIME types", async () => {
    const file = new File(["data"], "doc.pdf", { type: "application/pdf" });
    await expect(resizeImage(file)).rejects.toThrow("must be an image");
  });

  it("rejects files larger than 5MB", async () => {
    const big = new File([new ArrayBuffer(6 * 1024 * 1024)], "big.png", {
      type: "image/png",
    });
    await expect(resizeImage(big)).rejects.toThrow("5MB");
  });

  it("accepts a valid image and returns a webp blob", async () => {
    const mockToBlob = vi.fn((cb: BlobCallback) => {
      cb(new Blob(["fake"], { type: "image/webp" }));
    });
    const mockDrawImage = vi.fn();
    const mockGetContext = vi.fn(() => ({
      drawImage: mockDrawImage,
    }));

    const mockCanvas = {
      width: 0,
      height: 0,
      getContext: mockGetContext,
      toBlob: mockToBlob,
    };
    vi.spyOn(document, "createElement").mockReturnValue(
      mockCanvas as unknown as HTMLElement,
    );

    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL: vi.fn(() => "blob:fake"),
      revokeObjectURL: vi.fn(),
    });

    vi.stubGlobal(
      "Image",
      class {
        width = 800;
        height = 600;
        onload: (() => void) | null = null;
        set src(_: string) {
          setTimeout(() => this.onload?.(), 0);
        }
      },
    );

    const file = new File(["pixel-data"], "photo.png", { type: "image/png" });
    const blob = await resizeImage(file);

    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe("image/webp");
    expect(mockDrawImage).toHaveBeenCalled();
  });
});
