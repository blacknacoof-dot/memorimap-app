export type FacilityIdentifier =
    | { type: "legacy"; value: number; raw: string }
    | { type: "sangjo"; value: string; raw: string };

const UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function parseFacilityIdentifier(
    input: unknown,
): { ok: true; identifier: FacilityIdentifier } | { ok: false; error: string } {
    if (typeof input !== "string") {
        return { ok: false, error: "facility_id must be a string" };
    }

    const trimmed = input.trim();
    if (!trimmed) {
        return { ok: false, error: "facility_id must not be empty" };
    }

    if (/^\d+$/.test(trimmed)) {
        const numericValue = Number(trimmed);
        if (!Number.isSafeInteger(numericValue) || numericValue <= 0) {
            return { ok: false, error: "legacy facility_id must be a positive integer" };
        }

        return {
            ok: true,
            identifier: { type: "legacy", value: numericValue, raw: trimmed },
        };
    }

    if (UUID_REGEX.test(trimmed)) {
        return {
            ok: true,
            identifier: { type: "sangjo", value: trimmed.toLowerCase(), raw: trimmed },
        };
    }

    return {
        ok: false,
        error: "facility_id must be a positive legacy number or sangjo UUID",
    };
}
