import argon2 from "argon2";

const password = "admin123";

const run = async () => {
  const hash = await argon2.hash(password);
  console.log("Hashed password:", hash);
};

run();