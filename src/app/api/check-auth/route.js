import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getUserFromToken } from '@/lib/auth';

export async function GET() {
    const cookiestore = await cookies();
  const token = await cookiestore.get('token')?.value; 

  if (!token) {
    console.error("Token missing in request."); 
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const userData = getUserFromToken(token);

  if (!userData) {
    console.error("Invalid or expired token."); 
    return NextResponse.json({ authenticated: false }, { status:401 });
  }

  return NextResponse.json({ authenticated: true, userId: userData.userId }); 
}