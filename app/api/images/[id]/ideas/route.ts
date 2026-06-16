import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Cette route V0.1 a ete remplacee par /api/projects/[id]/ideas." },
    { status: 410 }
  );
}
