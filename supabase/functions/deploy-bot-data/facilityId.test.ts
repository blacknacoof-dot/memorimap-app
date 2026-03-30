import { describe, expect, it } from "vitest";

import { parseFacilityIdentifier } from "./facilityId";

describe("parseFacilityIdentifier", () => {
    it("parses numeric legacy ids", () => {
        const result = parseFacilityIdentifier("12345");

        expect(result).toEqual({
            ok: true,
            identifier: { type: "legacy", value: 12345, raw: "12345" },
        });
    });

    it("parses sangjo UUID ids", () => {
        const result = parseFacilityIdentifier("666dc22b-b71c-4ac1-b834-d06a1d4567e1");

        expect(result).toEqual({
            ok: true,
            identifier: {
                type: "sangjo",
                value: "666dc22b-b71c-4ac1-b834-d06a1d4567e1",
                raw: "666dc22b-b71c-4ac1-b834-d06a1d4567e1",
            },
        });
    });

    it("rejects blank and malformed ids", () => {
        expect(parseFacilityIdentifier("")).toEqual({
            ok: false,
            error: "facility_id must not be empty",
        });
        expect(parseFacilityIdentifier("abc")).toEqual({
            ok: false,
            error: "facility_id must be a positive legacy number or sangjo UUID",
        });
    });
});
