import twilio from "twilio";

const client = twilio(
  process.env.TWILIO_SID,
  process.env.TWILIO_TOKEN
);

export const sendSMS = async (phone, password) => {
  await client.messages.create({
    body: `Your HMS login password is: ${password}. Please change after login.`,
    from: process.env.TWILIO_PHONE,
    to: phone
  });
};