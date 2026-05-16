import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, followsTable } from "@workspace/db";
import { sql, ilike, or, eq, and, ne } from "drizzle-orm";

const router = Router();

function getUserId(req: any): string | null {
  return req.headers["x-user-id"] as string | null;
}

router.get("/users", async (req, res) => {
  const q = req.query.q as string;
  if (!q || q.trim().length === 0) return res.json([]);
  const currentUserId = getUserId(req);

  const users = await db
    .select()
    .from(usersTable)
    .where(or(ilike(usersTable.username, `%${q}%`), ilike(usersTable.display_name, `%${q}%`)))
    .limit(20);

  const result = await Promise.all(
    users.map(async (u) => {
      const [fc] = await db.select({ count: sql<number>`count(*)::int` }).from(followsTable).where(eq(followsTable.following_id, u.id));
      let is_following = false;
      if (currentUserId) {
        const [fw] = await db.select().from(followsTable).where(and(eq(followsTable.follower_id, currentUserId), eq(followsTable.following_id, u.id)));
        is_following = !!fw;
      }
      return { ...u, followers_count: fc?.count ?? 0, is_following };
    })
  );

  return res.json(result);
});

export default router;
