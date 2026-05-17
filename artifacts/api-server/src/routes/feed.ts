import { Router } from "express";
import { db } from "@workspace/db";
import { postsTable, usersTable, likesTable, commentsTable, followsTable } from "@workspace/db";
import { eq, sql, desc, inArray, and } from "drizzle-orm";

const router = Router();

function getUserId(req: any): string | null {
  return req.headers["x-user-id"] as string | null;
}

async function buildPost(post: any, currentUserId: string | null) {
  const [author] = await db.select().from(usersTable).where(eq(usersTable.id, post.author_id));
  const [lc] = await db.select({ count: sql<number>`count(*)::int` }).from(likesTable).where(eq(likesTable.post_id, post.id));
  const [cc] = await db.select({ count: sql<number>`count(*)::int` }).from(commentsTable).where(eq(commentsTable.post_id, post.id));
  let is_liked = false;
  if (currentUserId) {
    const [like] = await db.select().from(likesTable).where(and(eq(likesTable.post_id, post.id), eq(likesTable.user_id, currentUserId)));
    is_liked = !!like;
  }
  const [afc] = await db.select({ count: sql<number>`count(*)::int` }).from(followsTable).where(eq(followsTable.following_id, post.author_id));
  let author_is_following = false;
  if (currentUserId && author) {
    const [fw] = await db.select().from(followsTable).where(and(eq(followsTable.follower_id, currentUserId), eq(followsTable.following_id, post.author_id)));
    author_is_following = !!fw;
  }
  return {
    id: post.id,
    content: post.content,
    image_url: post.image_url,
    created_at: post.created_at,
    updated_at: post.updated_at,
    likes_count: lc?.count ?? 0,
    comments_count: cc?.count ?? 0,
    views_count: post.views_count ?? 0,
    is_liked,
    author: author ? {
      id: author.id,
      username: author.username,
      display_name: author.display_name,
      avatar_url: author.avatar_url,
      bio: author.bio,
      is_following: author_is_following,
      followers_count: afc?.count ?? 0,
    } : null,
  };
}

router.get("/following", async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const following = await db.select({ id: followsTable.following_id }).from(followsTable).where(eq(followsTable.follower_id, userId));
  const followingIds = following.map((f) => f.id);

  if (followingIds.length === 0) {
    return res.json({ posts: [], has_more: false, next_cursor: null });
  }

  const posts = await db.select().from(postsTable).where(inArray(postsTable.author_id, followingIds)).orderBy(desc(postsTable.created_at)).limit(30);
  const result = await Promise.all(posts.map((p) => buildPost(p, userId)));
  return res.json({ posts: result, has_more: false, next_cursor: null });
});

export default router;
