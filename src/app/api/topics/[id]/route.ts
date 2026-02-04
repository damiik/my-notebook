import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Topic from '@/models/Topic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const topic = await Topic.findById(id);
    if (!topic) {
      return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
    }
    return NextResponse.json(topic);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch topic' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const body = await request.json();
    
    // Remove protected/internal fields from body to avoid validation errors
    const { _id, __v, createdAt, updatedAt, ...updateData } = body;

    const topic = await Topic.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!topic) {
      return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
    }
    return NextResponse.json(topic);
  } catch (error: any) {
    console.error('Update Topic Error:', error);
    return NextResponse.json({ 
      error: 'Failed to update topic',
      details: error.message 
    }, { status: 400 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const deletedTopic = await Topic.findByIdAndDelete(id);
    if (!deletedTopic) {
      return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Topic deleted' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete topic' }, { status: 500 });
  }
}
