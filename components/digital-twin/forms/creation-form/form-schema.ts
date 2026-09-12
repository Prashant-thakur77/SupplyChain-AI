import { z } from "zod";

// ─── Full schema (used by zodResolver on final submit) ─────────────────────
export const formSchema = z.object({
    industry: z.string().min(1, "Industry is required."),
    customIndustry: z.string().optional(),
    productCharacteristics: z.array(z.string()).min(1, "At least one characteristic must be selected."),
    supplierTiers: z.string().min(1, "Supplier tier is required."),
    operationsLocation: z.array(z.string()).min(1, "At least one location must be selected."),
    country: z.string().optional(),
    currency: z.string().min(1, "Currency is required."),
    shippingMethods: z.array(z.string()).min(1, "At least one shipping method must be selected."),
    annualVolumeType: z.enum(["units", "currency"]),
    annualVolumeValue: z.number({ error: "Annual volume must be a number." }).gt(0, "Annual volume must be greater than 0."),
    risks: z.array(z.string()).min(1, "At least one risk must be selected."),
}).refine(data => {
    if (data.industry === 'Other') {
        return !!data.customIndustry && data.customIndustry.length > 0;
    }
    return true;
}, {
    message: "Please specify the industry",
    path: ["customIndustry"],
}).refine(data => {
    if (data.operationsLocation.includes('domestic')) {
        return !!data.country && data.country.length > 0;
    }
    return true;
}, {
    message: "Please select a country for domestic operations",
    path: ["country"],
});

export type FormData = z.infer<typeof formSchema>;

// ─── Per-step schemas (used with safeParse during step navigation) ──────────
// These never throw — they use safeParse so Sentry is never triggered.

export const step0Schema = z.object({
    industry: z.string().min(1, "Industry is required."),
    customIndustry: z.string().optional(),
    productCharacteristics: z.array(z.string()).min(1, "At least one characteristic must be selected."),
    supplierTiers: z.string().min(1, "Supplier tier is required."),
    operationsLocation: z.array(z.string()).min(1, "At least one location must be selected."),
    country: z.string().optional(),
}).refine(data => {
    if (data.industry === 'Other') {
        return !!data.customIndustry && data.customIndustry.length > 0;
    }
    return true;
}, {
    message: "Please specify the industry",
    path: ["customIndustry"],
}).refine(data => {
    if (data.operationsLocation.includes('domestic')) {
        return !!data.country && data.country.length > 0;
    }
    return true;
}, {
    message: "Please select a country for domestic operations",
    path: ["country"],
});

export const step1Schema = z.object({
    currency: z.string().min(1, "Currency is required."),
    shippingMethods: z.array(z.string()).min(1, "At least one shipping method must be selected."),
    annualVolumeType: z.enum(["units", "currency"]),
    annualVolumeValue: z.number({ error: "Annual volume must be a number." }).gt(0, "Annual volume must be greater than 0."),
});

export const step2Schema = z.object({
    risks: z.array(z.string()).min(1, "At least one risk must be selected."),
});

export const STEP_SCHEMAS = [step0Schema, step1Schema, step2Schema] as const;