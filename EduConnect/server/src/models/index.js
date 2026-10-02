import mongoose from 'mongoose';

export { User, ROLES } from './User.js';
export { Classroom } from './Classroom.js';

const { Schema, model } = mongoose;
const ref = (name, required = true) => ({ type: Schema.Types.ObjectId, ref: name, required });

export const Session = model(
  'Session',
  new Schema(
    {
      classroom: ref('Classroom'),
      title: { type: String, required: true, trim: true },
      description: { type: String, default: '' },
      startsAt: { type: Date, required: true },
      durationMinutes: { type: Number, default: 60, min: 5, max: 600 },
      roomName: { type: String, required: true },
      status: { type: String, enum: ['scheduled', 'live', 'ended', 'cancelled'], default: 'scheduled' },
      attendees: [ref('User', false)],
      createdBy: ref('User'),
    },
    { timestamps: true }
  )
);

export const Material = model(
  'Material',
  new Schema(
    {
      classroom: ref('Classroom'),
      title: { type: String, required: true, trim: true },
      description: { type: String, default: '' },
      type: { type: String, enum: ['file', 'link'], required: true },
      url: { type: String, required: true },
      fileName: String,
      fileSize: Number,
      uploadedBy: ref('User'),
    },
    { timestamps: true }
  )
);

export const Assignment = model(
  'Assignment',
  new Schema(
    {
      classroom: ref('Classroom'),
      title: { type: String, required: true, trim: true },
      description: { type: String, default: '' },
      dueDate: { type: Date, required: true },
      maxMarks: { type: Number, default: 100, min: 1 },
      attachmentUrl: String,
      createdBy: ref('User'),
    },
    { timestamps: true }
  )
);

const submissionSchema = new Schema(
  {
    assignment: ref('Assignment'),
    student: ref('User'),
    text: { type: String, default: '' },
    fileUrl: String,
    fileName: String,
    submittedAt: { type: Date, default: Date.now },
    isLate: { type: Boolean, default: false },
    grade: { type: Number, min: 0 },
    feedback: { type: String, default: '' },
    gradedAt: Date,
  },
  { timestamps: true }
);
submissionSchema.index({ assignment: 1, student: 1 }, { unique: true });
export const Submission = model('Submission', submissionSchema);

export const Message = model(
  'Message',
  new Schema(
    {
      classroom: ref('Classroom'),
      sender: ref('User'),
      text: { type: String, required: true, trim: true, maxlength: 2000 },
    },
    { timestamps: true }
  )
);

export const Announcement = model(
  'Announcement',
  new Schema(
    {
      classroom: ref('Classroom'),
      author: ref('User'),
      text: { type: String, required: true, trim: true, maxlength: 3000 },
    },
    { timestamps: true }
  )
);

export const Booking = model(
  'Booking',
  new Schema(
    {
      tutor: ref('User'),
      student: ref('User'),
      subject: { type: String, required: true },
      startsAt: { type: Date, required: true },
      durationMinutes: { type: Number, default: 60 },
      note: { type: String, default: '' },
      status: { type: String, enum: ['pending', 'confirmed', 'declined', 'cancelled', 'completed'], default: 'pending' },
      roomName: String,
    },
    { timestamps: true }
  )
);

export const Review = model(
  'Review',
  new Schema(
    {
      tutor: ref('User'),
      student: ref('User'),
      rating: { type: Number, min: 1, max: 5, required: true },
      comment: { type: String, default: '', maxlength: 1000 },
    },
    { timestamps: true }
  )
);
