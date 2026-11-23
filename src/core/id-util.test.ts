import { describe, expect, it } from "vitest";
import { getIdGenerator } from "./id-util";

describe("getIdGenerator", () => {
  it("should start at zero with default parameters", () => {
    const getId = getIdGenerator();

    expect(getId()).toEqual(0);
    expect(getId()).toEqual(1);
    expect(getId()).toEqual(2);
  });

  it("should start at specified ID", () => {
    const getId = getIdGenerator(67);

    expect(getId()).toEqual(67);
    expect(getId()).toEqual(68);
    expect(getId()).toEqual(69);
  });
});
