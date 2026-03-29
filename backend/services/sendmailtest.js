import { sendEmail } from "./utils/sendEmail.js";

sendEmail("psavanthika03@gmail.com", "shyna", "1234")
  .then(() => console.log("Email sent"))
  .catch(console.error);