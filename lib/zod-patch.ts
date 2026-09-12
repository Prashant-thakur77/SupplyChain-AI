import { z } from 'zod';

// @google/adk assumes Zod v4 and calls .loose() on objects.
// Our workspace uses Zod v3.25 where the equivalent is .passthrough().
// We monkey-patch the prototype to prevent runtime crashes when ADK initializes.
if (typeof (z.ZodObject.prototype as any).loose === 'undefined') {
  (z.ZodObject.prototype as any).loose = z.ZodObject.prototype.passthrough;
}
