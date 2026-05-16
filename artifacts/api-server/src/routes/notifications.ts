import { Router } from "express";
import { db } from "@workspace/db";
import { notificationsTable, usersTable, followsTable } from "@workspace/db";
import { eq, sql, desc } from "drizzle-orm";

const router = Router();

function getUserId(req: any): string | null {
  return req.headers["x-user-id"] as string | null;
}

router.get("/unread-count", async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const [result] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(notificationsTable)
    .where(eq(notificationsTable.user_id, userId));
  return res.json({ count: result?.count ?? 0 });
});

router.post("/read", async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const result = await db
    .update(notificationsTable)
    .set({ is_read: true })
    .where(eq(notificationsTable.user_id, userId))
    .returning();
  return res.json({ updated: result.length });
});

router.get("/", async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const notifications = await db
    .select()
    .from(notificationsTable)
    .where(eq(notificationsTable.user_id, userId))
    .orderBy(desc(notificationsTable.created_at))
    .limit(30);

  const withActors = await Promise.all(
    notifications.map(async (n) => {
      const [actor] = await db.select().from(usersTable).where(eq(usersTable.id, n.actor_id));
      const [afc] = await db.select({ count: sql<number>`count(*)::int` }).from(followsTable).where(eq(followsTable.following_id, n.actor_id));
      return {
        id: n.id,
        type: n.type,
        post_id: n.post_id,
        post_content: n.post_content,
        comment_content: n.comment_content,
        created_at: n.created_at,
        is_read: n.is_read,
        actor: actor ? {
          id: actor.id,
          username: actor.username,
          display_name: actor.display_name,
          avatar_url: actor.avatar_url,
          bio: actor.bio,
          is_following: false,
          followers_count: afc?.count ?? 0,
        } : null,
      };
    })
  );

  return res.json({ notifications: withActors, has_more: false, next_cursor: null });
});

export default router;
