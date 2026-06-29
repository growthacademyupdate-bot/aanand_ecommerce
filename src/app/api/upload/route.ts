import { NextRequest, NextResponse } from 'next/server';
import { uploadImage } from '@/lib/cloudinary';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folder = formData.get('folder') as string || 'uploads';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const fileUrl = await uploadImage(file, folder);
    
    return NextResponse.json({ fileUrl });
  } catch (error) {
    console.error('Error uploading:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
