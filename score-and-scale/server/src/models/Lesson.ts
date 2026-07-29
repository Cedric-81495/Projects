import { Schema, model, type InferSchemaType } from 'mongoose'

/**
 * Academy curriculum. Lessons are grouped into ordered modules; a lesson is
 * unlocked for a customer once they hold an active enrollment in a program
 * listed in `programSlugs` (empty means available to every enrolled customer).
 */
const lessonSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    title: { type: String, required: true, trim: true },
    summary: { type: String, default: '' },
    module: { type: String, required: true, trim: true, index: true },
    moduleOrder: { type: Number, default: 0 },
    lessonOrder: { type: Number, default: 0 },
    durationMinutes: { type: Number, default: 0, min: 0 },
    videoUrl: { type: String, default: '' },
    /** Long-form lesson body, rendered as plain paragraphs on the client. */
    content: { type: String, default: '' },
    programSlugs: { type: [String], default: [] },
    published: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
)

lessonSchema.index({ moduleOrder: 1, lessonOrder: 1 })

export type LessonType = InferSchemaType<typeof lessonSchema>
export const Lesson = model<LessonType>('Lesson', lessonSchema)
