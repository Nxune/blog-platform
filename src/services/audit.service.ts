import { prisma } from "@/lib/prisma";

export type AuditAction =
  | "USER_DELETE"
  | "USER_ROLE_CHANGE"
  | "USER_BATCH_ROLE_CHANGE"
  | "USER_BATCH_DELETE"
  | "POST_DELETE"
  | "COMMENT_BATCH_MODERATE"
  | "COMMENT_DELETE";

export async function logAuditAction(params: {
  action: AuditAction;
  userId: string;
  targetId?: string;
  details?: string;
}) {
  await prisma.auditLog.create({
    data: {
      action: params.action,
      userId: params.userId,
      targetId: params.targetId ?? null,
      details: params.details ?? null,
    },
  });

  console.log(
    `[Audit] ${params.action} by ${params.userId}${
      params.targetId ? ` on ${params.targetId}` : ""
    }${params.details ? `: ${params.details}` : ""}`
  );
}
