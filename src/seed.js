import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDB } from "./config/db.js";
import { Unit } from "./models/Unit.js";
import { User } from "./models/User.js";
import { Zone } from "./models/Zone.js";

dotenv.config();

const zoneNames = [
  "Madina Town Zone",
  "Peoples Colony Zone",
  "Ghulam Muhammadabad Zone",
  "Samanabad Zone",
  "Jinnah Colony Zone",
  "D Ground Zone",
  "Nishatabad Zone",
  "Millat Town Zone"
];

async function seed() {
  await connectDB();

  const email = process.env.SEED_ADMIN_EMAIL || "president@bazm.test";
  const existingAdmin = await User.findOne({ email });

  if (!existingAdmin) {
    const password = process.env.SEED_ADMIN_PASSWORD || "ChangeMe123!";
    const passwordHash = await bcrypt.hash(password, 12);
    await User.create({
      name: process.env.SEED_ADMIN_NAME || "City President",
      email,
      passwordHash,
      role: "city_president",
      mustChangePassword: true
    });
    console.log(`Created city president: ${email}`);
    console.log(`Temporary password: ${password}`);
  } else {
    console.log(`City president already exists: ${email}`);
  }

  for (let index = 0; index < zoneNames.length; index += 1) {
    const code = `Z${index + 1}`;
    await Zone.updateOne(
      { code },
      {
        $setOnInsert: {
          name: zoneNames[index],
          code,
          description: `Student organization zone ${index + 1} in Faisalabad.`
        }
      },
      { upsert: true }
    );
  }

  const zones = await Zone.find().sort({ code: 1 });
  for (const zone of zones) {
    const code = `${zone.code}-U1`;
    await Unit.updateOne(
      { code },
      {
        $setOnInsert: {
          name: `${zone.name} Central Unit`,
          code,
          zone: zone._id,
          area: zone.name.replace(" Zone", ""),
          meetingDay: "Friday"
        }
      },
      { upsert: true }
    );
  }

  console.log(`Seeded ${zones.length} zones and one starter unit per zone.`);
}

seed()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
