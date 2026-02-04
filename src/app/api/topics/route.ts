import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Topic from '@/models/Topic';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const topics = await Topic.find({});
    return NextResponse.json(topics);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch topics' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    
    // Remove _id if it's empty to let Mongoose generate one
    if (body._id === '' || body._id === null) {
      delete body._id;
    }

    const topic = await Topic.create(body);
    return NextResponse.json(topic, { status: 201 });
  } catch (error: any) {
    console.error('Create Topic Error:', error);
    return NextResponse.json({ 
      error: 'Failed to create topic',
      details: error.message 
    }, { status: 400 });
  }
}
