import {connectDB} from "@/lib/db";
import User from "@/Models/User";
import bcrypt from "bcryptjs";

export async function POST(req) {
  await connectDB();
  const { username, password } = await req.json();

  const userExists = await User.findOne({ username });
  if (userExists) {
    return Response.json({ error: "User already exists" }, { status: 400 });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = await User.create({ username, password: hashedPassword });

  return Response.json({ message: "User created" });
}
