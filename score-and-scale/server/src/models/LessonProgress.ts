import { Schema, model, type InferSchemaType } from 'mongoose'

/**
 * One row per user per lesson. Kept separate from Lesson so curriculum edits
 * never touch customer progress, and separate from User so the document does
 * not grow unbounded as the academy expands.
 */
const lessonProgressSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    lessonId: { type: Schema.Types.ObjectId, ref: 'Lesson', required: true, index: true },
    completedAt: { type: Date, default: null },
    /** Furthest playback position, so video can resume where the user left off. */
    lastPositionSeconds: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
)

lessonProgressSchema.index({ userId: 1, lessonId: 1 }, { unique: true })

export type LessonProgressType = InferSchemaType<typeof lessonProgressSchema>
export const LessonProgress = model<LessonProgressType>('LessonProgress', lessonProgressSchema)
