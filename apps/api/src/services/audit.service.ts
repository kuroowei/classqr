import { Prisma } from "@prisma/client";
import prisma from "../config/prisma";
import { z } from "zod";
import { auditLogQuerySchema } from "../validators/audit.validator";

type AuditLogQuery = z.infer<typeof auditLogQuerySchema>;

interface AuditEntry {
  institutionId?: string | null;
  userId?: string | null;
  action: string;
  resource: string;
  resourceId?: string | null;
  ipAddress?: string | null;
}

// Never throws: a failed audit write must not break the request that triggered it.
export async function logAudit(entry: AuditEntry): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        institutionId: entry.institutionId ?? null,
        userId: entry.userId ?? null,
        action: entry.action,
        resource: entry.resource,
        resourceId: entry.resourceId ?? null,
        ipAddress: entry.ipAddress ?? null,
      },
    });
  } catch (err) {
    console.error("Audit log write failed:", err);
  }
}

export async function listAuditLogs(institutionId: string, filters: AuditLogQuery) {
  const where: Prisma.AuditLogWhereInput = {
    institutionId,
    ...(filters.action && { action: filters.action }),
    ...(filters.resource && { resource: filters.resource }),
    ...(filters.userId && { userId: filters.userId }),
    ...((filters.dateFrom || filters.dateTo) && {
      createdAt: {
        ...(filters.dateFrom && { gte: filters.dateFrom }),
        ...(filters.dateTo && { lte: filters.dateTo }),
      },
    }),
  };

  const [total, logs] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      include: { user: { select: { email: true, role: true } } },
      orderBy: { createdAt: "desc" },
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
    }),
  ]);

  return {
    total,
    page: filters.page,
    limit: filters.limit,
    totalPages: Math.ceil(total / filters.limit),
    logs,
  };
}