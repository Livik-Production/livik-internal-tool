// import { NextResponse } from "next/server";

// export async function POST() {
//   const response = NextResponse.json({ success: true });

//   // ✅ Clear the correct auth cookie
//   response.cookies.set("auth_session", "", {
//     httpOnly: true,
//     secure: process.env.NODE_ENV === "production",
//     path: "/",
//     expires: new Date(0),
//     maxAge: 0, // immediately expire
//     sameSite: "lax",
//   });

//   return response;
// }

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    // ✅ MUST await cookies()
    const cookieStore = await cookies();

    // Explicitly delete cookie with path to ensure matches
    cookieStore.set('auth_session', '', {
      path: '/',
      expires: new Date(0),
      maxAge: 0,
    });

    cookieStore.delete('auth_session');

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ message: 'Logout failed' }, { status: 500 });
  }
}
