import { z } from 'zod';

import { boundedTrimmedString, httpUrlString, optionalBoundedTrimmedString } from './commonSchema';

export const facilityNameSchema = boundedTrimmedString(1, 120);
export const facilityDescriptionSchema = optionalBoundedTrimmedString(3000);

export const facilityUpdateSchema = z.object({
    name: facilityNameSchema.optional(),
    description: facilityDescriptionSchema,
    website: httpUrlString,
});
