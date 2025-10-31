import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() || "";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
  const pageSize = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get("pageSize") || "10", 10) || 10)
  );

  const where: Prisma.PatientWhereInput = q
    ? {
        OR: [
          { name: { contains: q, mode: "insensitive" as Prisma.QueryMode } },
          { email: { contains: q, mode: "insensitive" as Prisma.QueryMode } },
          { phone: { contains: q, mode: "insensitive" as Prisma.QueryMode } },
        ],
      }
    : {};

  try {
    const [total, patients] = await Promise.all([
      prisma.patient.count({ where }),
      prisma.patient.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return Response.json({
      patients,
      total,
      page,
      pageSize,
      hasNext: page * pageSize < total,
      hasPrev: page > 1,
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: "Database unavailable" }), {
      status: 500,
    });
  }
}
