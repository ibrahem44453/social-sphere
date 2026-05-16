import { Router } from "express";
import { db } from "@workspace/db";
import { followsTable, usersTable, notificationsTable } from "@workspace/db";
import { eq, sql, and } from "drizzle-orm";
import { randomUUID } from "crypto";
import { FollowUserParams, UnfollowUserParams } from "@workspace/api-zod";

const router = Router();

function getUserId(req: any): string | null {
  return req.headers["x-user-id"] as string | null;
}

router.post("/:targetUserId", async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const parsed = FollowUserParams.safeParse(req.params);
  if (!parsed.success) return res.status(400).json({ error: "Invalid" });
  const { targetUserId } = parsed.data;

  if (userId === targetUserId) return res.status(400).json({ error: "Cannot follow yourself" });

  await db.insert(followsTable).values({ follower_id: userId, following_id: targetUserId }).onConflictDoNothing();

  await db.insert(notificationsTable).values({
    id: randomUUID(),
    user_id: targetUserId,
    actor_id: userId,
    type: "follow",
    post_id: null,
  }).onConflictDoNothing();

  const [fc] = await db.select({ count: sql<number>`count(*)::int` }).from(followsTable).where(eq(followsTable.following_id, targetUserId));
  return res.json({ following: true, followers_count: fc?.count ?? 0 });
});

router.delete("/:targetUserId", async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const parsed = UnfollowUserParams.safeParse(req.params);
  if (!parsed.success) return res.status(400).json({ error: "Invalid" });
  const { targetUserId } = parsed.data;

  await db.delete(followsTable).where(and(eq(followsTable.follower_id, userId), eq(followsTable.following_id, targetUserId)));

  const [fc] = await db.select({ count: sql<number>`count(*)::int` }).from(followsTable).where(eq(followsTable.following_id, targetUserId));
  return res.json({ following: false, followers_count: fc?.count ?? 0 });
});

export default router;
