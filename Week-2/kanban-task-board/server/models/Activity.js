import mongoose from "mongoose";

const activitySchema = new mongoose.Schema(
  {
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        "created",
        "assigned",
        "status_changed",
        "priority_changed",
        "due_date_changed",
        "updated",
        "comment_added",
        "deleted",
      ],
    },
    previousValue: {
      type: String,
      default: null,
    },
    newValue: {
      type: String,
      default: null,
    },
  },
  { timestamps: true },
);

const Activity = mongoose.model("Activity", activitySchema);

export default Activity;
