import { Schema, model, type InferSchemaType } from 'mongoose'

/**
 * A purchasable tier shown on the funnel page.
 *
 * `priceCents` is the single source of truth for what a customer is charged.
 * Checkout reads it server-side and never accepts an amount from the client,
 * so the price cannot be tampered with in the browser.
 */
const programSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    name: { type: String, required: true, trim: true },
    tagline: { type: String, default: '' },
    description: { type: String, default: '' },
    priceCents: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'USD', uppercase: true },
    features: { type: [String], default: [] },
    /** Drives the "most popular" treatment in the pricing grid. */
    highlighted: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0, index: true },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
)

export type ProgramType = InferSchemaType<typeof programSchema>
export const Program = model<ProgramType>('Program', programSchema)
