import Appointment from "../models/Appointment.js";
import User from "../models/User.js";

export const getPatientAvailableSlots = async (doctorId, date) => {
  try {
    const doctor = await User.findById(doctorId);
    if (!doctor || !doctor.workingHours) return [];

    const { startTime, endTime, slotDuration } = doctor.workingHours;
    const duration = slotDuration || 30; 

    const appointments = await Appointment.find({
      doctorId,
      date: {
        $gte: new Date(date.setHours(0, 0, 0, 0)),
        $lt: new Date(date.setHours(23, 59, 59, 999)),
      },
    });

    const bookedSlots = appointments.map(a => a.timeSlot?.startTime).filter(Boolean);

    const availableSlots = [];
    const [startH, startM] = startTime.split(":").map(Number);
    const [endH, endM] = endTime.split(":").map(Number);

    let currentMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    while (currentMinutes + duration <= endMinutes) {
      const startHours = Math.floor(currentMinutes / 60).toString().padStart(2, "0");
      const startMinutes = (currentMinutes % 60).toString().padStart(2, "0");

      const endTimeMinutes = currentMinutes + duration;
      const endHours = Math.floor(endTimeMinutes / 60).toString().padStart(2, "0");
      const endMinutesStr = (endTimeMinutes % 60).toString().padStart(2, "0");

      const slotStr = `${startHours}:${startMinutes}-${endHours}:${endMinutesStr}`;

      if (!bookedSlots.includes(`${startHours}:${startMinutes}`)) {
        availableSlots.push(slotStr);
      }

      
      currentMinutes += duration + 30;
    }

    return availableSlots;
  } catch (err) {
    console.error("getPatientAvailableSlots ERROR:", err);
    return [];
  }
};