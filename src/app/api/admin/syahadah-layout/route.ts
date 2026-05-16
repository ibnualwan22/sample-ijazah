import { NextRequest, NextResponse } from "next/server";
import { getProgramLayout, getLayoutForRiwayat, saveLayout, deleteLayoutOverride } from "@/lib/syahadah-layout";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const riwayatId = searchParams.get("riwayatId");
  const programId = searchParams.get("programId");

  try {
    const layout = riwayatId && programId
      ? await getLayoutForRiwayat(riwayatId, programId)
      : programId 
        ? await getProgramLayout(programId)
        : await getProgramLayout("dummy-fallback"); // Should usually provide programId

    return NextResponse.json({ layout });
  } catch (error) {
    console.error("Error fetching layout:", error);
    return NextResponse.json({ error: "Failed to fetch layout" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { riwayatId, programId, layoutData } = body;

    if (!layoutData || typeof layoutData !== "object") {
      return NextResponse.json({ error: "Invalid layoutData" }, { status: 400 });
    }

    await saveLayout({ riwayatId, programId }, layoutData);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving layout:", error);
    return NextResponse.json({ error: "Failed to save layout" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const riwayatId = searchParams.get("riwayatId");
  const programId = searchParams.get("programId");

  if (!riwayatId && !programId) {
    return NextResponse.json({ error: "riwayatId or programId is required" }, { status: 400 });
  }

  try {
    await deleteLayoutOverride({ riwayatId, programId });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting layout:", error);
    return NextResponse.json({ error: "Failed to delete layout" }, { status: 500 });
  }
}
