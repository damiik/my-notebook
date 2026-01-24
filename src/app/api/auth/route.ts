import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/db';
import User from '@/models/User';

// Login user
export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const { email, password } = await req.json();

    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ msg: 'Invalid Credentials' }, { status: 400 });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json({ msg: 'Invalid Credentials' }, { status: 400 });
    }

    const payload = {
      user: {
        id: user.id,
      },
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET!, {
      expiresIn: 36000,
    });

    return NextResponse.json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ msg: 'Server error' }, { status: 500 });
  }
}

// Get user data
export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const token = req.headers.get('x-auth-token');

    if (!token) {
      return NextResponse.json({ msg: 'No token, authorization denied' }, { status: 401 });
    }

    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
    const user = await User.findById(decoded.user.id).select('-password');

    if (!user) {
      return NextResponse.json({ msg: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ msg: 'Token is not valid' }, { status: 401 });
  }
}
