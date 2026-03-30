import { z } from 'zod';

export const trimmedString = z.string().transform((value) => value.trim());

export const boundedTrimmedString = (min: number, max: number) =>
    trimmedString.refine((value) => value.length >= min, { message: `Must be at least ${min} characters` })
        .refine((value) => value.length <= max, { message: `Must be at most ${max} characters` });

export const optionalBoundedTrimmedString = (max: number) =>
    z.union([z.string(), z.null(), z.undefined()])
        .transform((value) => (typeof value === 'string' ? value.trim() : value))
        .refine((value) => value == null || value.length <= max, { message: `Must be at most ${max} characters` });

export const httpUrlString = z.union([z.string(), z.null(), z.undefined()])
    .transform((value) => (typeof value === 'string' ? value.trim() : value))
    .refine((value) => value == null || value === '' || /^https?:\/\//i.test(value), {
        message: 'URL must use http or https',
    })
    .refine((value) => value == null || value === '' || z.string().url().safeParse(value).success, {
        message: 'URL must be valid',
    });

export function isZodIssueCode(message: string): 'INVALID_URL' | 'TEXT_TOO_LONG' | 'TEXT_TOO_SHORT' | 'INVALID_TEXT' {
    if (/http or https|must be valid/i.test(message)) return 'INVALID_URL';
    if (/at most/i.test(message)) return 'TEXT_TOO_LONG';
    if (/at least/i.test(message)) return 'TEXT_TOO_SHORT';
    return 'INVALID_TEXT';
}
