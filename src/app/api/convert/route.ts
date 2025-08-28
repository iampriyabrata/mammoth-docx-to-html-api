import { NextResponse } from "next/server";
import mammoth from "mammoth";

function toExportUrl(inputUrl: string): string {
  const match = inputUrl.match(/\/d\/([a-zA-Z0-9-_]+)\//);
  if (match) {
    const id = match[1];
    return `https://docs.google.com/document/d/${id}/export?format=docx`;
  }
  return inputUrl;
}

export async function POST(request: Request) {
  try {
    const { url } = (await request.json()) as { url?: string };

    if (!url) {
      return NextResponse.json(
        { success: false, error: "No URL provided" },
        { status: 400 }
      );
    }

    const fetchUrl = toExportUrl(url);

    const res = await fetch(fetchUrl);
    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: `Failed to fetch file: ${res.statusText}` },
        { status: res.status }
      );
    }

    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Convert DOCX → HTML
    const { value: rawHtml } = await mammoth.convertToHtml({ buffer });

    // Replace any <img> tags with <p><u>[Image]</u></p>
    const html = rawHtml.replace(/<img[^>]*>/gi, '<p><u>[Image]</u></p>');

    return NextResponse.json({
      success: true,
      message: "Conversion successful",
      html,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
