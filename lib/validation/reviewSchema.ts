import { z } from 'zod';

import { boundedTrimmedString } from './commonSchema';

export const reviewContentSchema = boundedTrimmedString(10, 1000);

export const reviewSubmissionSchema = z.object({
    content: reviewContentSchema,
});
