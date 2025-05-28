import { cookies } from "next/headers";

export async function POST() {
  const cookieStore = await cookies(); 
  cookieStore.set("token", "", { maxAge: 0, path: "/" }); 

  return Response.json({ message: "Logged out" });
}