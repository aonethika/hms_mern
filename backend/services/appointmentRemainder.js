import cron from "node-cron";
import Appointment from "../models/Appointment.js";
import Notification from "../models/Notification.js";

const startAppointmentReminder = () => {

  cron.schedule("0 1 * * *", async () => {
    try {

      const today = new Date();
      today.setHours(0,0,0,0);

      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const dayAfterTomorrow = new Date(today);
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

      const todayAppointments = await Appointment.find({
        date: { $gte: today, $lt: tomorrow },
        status: "scheduled"
      }).populate({
        path: "patientId",
        select: "userId"
      });

      for (const appt of todayAppointments) {
        if (!appt.patientId?.userId) continue;

        const exists = await Notification.findOne({
          appointmentId: appt._id,
          message: "Reminder: You have a hospital visit today."
        });

        if (exists) continue;

        await Notification.create({
          message: "Reminder: You have a hospital visit today.",
          receiver: appt.patientId.userId,
          receiverRole: "patient",
          appointmentId: appt._id,
          type: "appointment",
          scheduledFor: new Date()
        });
      }

      const tomorrowAppointments = await Appointment.find({
        date: { $gte: tomorrow, $lt: dayAfterTomorrow },
        status: "scheduled"
      }).populate({
        path: "patientId",
        select: "userId"
      });

      for (const appt of tomorrowAppointments) {
        if (!appt.patientId?.userId) continue;

        const exists = await Notification.findOne({
          appointmentId: appt._id,
          message: "Reminder: You have an appointment tomorrow."
        });

        if (exists) continue;

        await Notification.create({
          message: "Reminder: You have an appointment tomorrow.",
          receiver: appt.patientId.userId,
          receiverRole: "patient",
          appointmentId: appt._id,
          type: "appointment",
          scheduledFor: new Date()
        });
      }

      console.log("Appointment reminders created");

    } catch (err) {
      console.log("REMINDER CRON ERROR", err);
    }
  });

};

export default startAppointmentReminder;