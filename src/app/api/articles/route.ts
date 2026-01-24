import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Article from '@/models/Article';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const articles = await Article.find({});
    return NextResponse.json(articles);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch articles' }, { status: 500 });
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

    const article = await Article.create(body);
    return NextResponse.json(article, { status: 201 });
  } catch (error: any) {
    console.error('Create Article Error:', error);
    return NextResponse.json({ 
      error: 'Failed to create article',
      details: error.message 
    }, { status: 400 });
  }
}
