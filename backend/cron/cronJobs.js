import cron from "node-cron";
import { markNoShowInternal } from "../controllers/appoinmentController.js";
import Leave from "../models/Leave.js";
import User from "../models/User.js";


export const startCronJobs = () => {
  console.log("Cron job initialized..."); 

  // ---------------- NO SHOW CRON ----------------
  cron.schedule(
    "59 23 * * *",
    async () => {
      console.log("Running no-show cron...");
      await markNoShowInternal();
    },
    {
      timezone: "Asia/Kolkata", 
    }
  );



  // ---------------- LEAVE STATUS CRON ----------------
  cron.schedule("0 * * * *", async () => {
    console.log("Running leave status cron...");

    const today = new Date();

    // ACTIVE LEAVES → set on_leave
    const activeLeaves = await Leave.find({
      status: "approved",
      startDate: { $lte: today },
      endDate: { $gte: today },
    });

    for (const leave of activeLeaves) {
      await User.findByIdAndUpdate(leave.doctorId, {
        status: "on_leave",
        isActive: false,
      });
    }

    // ENDED LEAVES → restore
    const endedLeaves = await Leave.find({
      status: "approved",
      endDate: { $lt: today },
    });

    for (const leave of endedLeaves) {
      await User.findByIdAndUpdate(leave.doctorId, {
        status: "available",
        isActive: true,
      });
    }
  });
};