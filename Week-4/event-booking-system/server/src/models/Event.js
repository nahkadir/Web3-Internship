import mongoose from "mongoose";

export const EVENT_STATUSES = ["UPCOMING", "ONGOING", "COMPLETED", "CANCELLED"];

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 100,
    },
    description: { type: String, required: true, trim: true, maxlength: 2000 },
    location: { type: String, required: true, trim: true, maxlength: 200 },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    totalSeats: {
      type: Number,
      required: true,
      min: 1,
      validate: {
        validator: Number.isInteger,
        message: "totalSeats must be an integer",
      },
    },
    availableSeats: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: function (value) {
          return value <= this.totalSeats;
        },
        message: "availableSeats cannot exceed totalSeats",
      },
    },
    price: { type: Number, required: true, min: 0 },
    status: { type: String, enum: EVENT_STATUSES, default: "UPCOMING" },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        delete ret.__v;
        return ret;
      },
    },
  },
);

eventSchema.pre("validate", function () {
  if (this.isNew) this.availableSeats = this.totalSeats;
});

eventSchema.index({ status: 1, startDate: 1 });

export default mongoose.model("Event", eventSchema);
