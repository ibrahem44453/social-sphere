import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, followsTable, postsTable, likesTable, commentsTable } from "@workspace/db";
import { eq, sql, and, ilike, or, ne } from "drizzle-orm";
import { randomUUID } from "crypto";
import {
  GetUserProfileParams,
  UpdateProfileBody,
  ListUserPostsParams,
  GetFollowersParams,
  GetFollowingParams,
} from "@workspace/api-zod";

const router = Router();

function getUserId(req: any): string | null {
  return req.headers["x-user-id"] as string | null;
}

router.get("/me/suggested", async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const alreadyFollowing = db
    .select({ id: followsTable.following_id })
    .from(followsTable)
    .where(eq(followsTable.follower_id, userId));

  const suggested = await db
    .select({
      id: usersTable.id,
      username: usersTable.username,
      display_name: usersTable.display_name,
      avatar_url: usersTable.avatar_url,
      bio: usersTable.bio,
    })
    .from(usersTable)
    .where(and(ne(usersTable.id, userId)))
    .limit(10);

  const followingIds = (await alreadyFollowing).map((f) => f.id);
  const filtered = suggested.filter((u) => !followingIds.includes(u.id));

  const withCounts = await Promise.all(
    filtered.slice(0, 6).map(async (u) => {
      const [fc] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(followsTable)
        .where(eq(followsTable.following_id, u.id));
      return {
        ...u,
        followers_count: fc?.count ?? 0,
        is_following: false,
      };
    })
  );

  return res.json(withCounts);
});

router.get("/me/profile", async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) return res.status(404).json({ error: "Not found" });
  return res.json(user);
});

router.patch("/me/profile", async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const parsed = UpdateProfileBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid body" });

  const updates: Record<string, unknown> = {};
  if (parsed.data.display_name !== undefined) updates.display_name = parsed.data.display_name;
  if (parsed.data.bio !== undefined) updates.bio = parsed.data.bio;
  if (parsed.data.avatar_url !== undefined) updates.avatar_url = parsed.data.avatar_url;
  if (parsed.data.website !== undefined) updates.website = parsed.data.website;

  if (Object.keys(updates).length === 0) {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
    const [fc] = await db.select({ count: sql<number>`count(*)::int` }).from(followsTable).where(eq(followsTable.following_id, userId));
    const [fing] = await db.select({ count: sql<number>`count(*)::int` }).from(followsTable).where(eq(followsTable.follower_id, userId));
    const [pc] = await db.select({ count: sql<number>`count(*)::int` }).from(postsTable).where(eq(postsTable.author_id, userId));
    return res.json({ ...user, followers_count: fc?.count ?? 0, following_count: fing?.count ?? 0, posts_count: pc?.count ?? 0, is_following: false });
  }

  const [updated] = await db.update(usersTable).set(updates).where(eq(usersTable.id, userId)).returning();
  const [fc] = await db.select({ count: sql<number>`count(*)::int` }).from(followsTable).where(eq(followsTable.following_id, userId));
  const [fing] = await db.select({ count: sql<number>`count(*)::int` }).from(followsTable).where(eq(followsTable.follower_id, userId));
  const [pc] = await db.select({ count: sql<number>`count(*)::int` }).from(postsTable).where(eq(postsTable.author_id, userId));
  return res.json({ ...updated, followers_count: fc?.count ?? 0, following_count: fing?.count ?? 0, posts_count: pc?.count ?? 0, is_following: false });
});

router.get("/:username", async (req, res) => {
  const parsed = GetUserProfileParams.safeParse(req.params);
  if (!parsed.success) return res.status(400).json({ error: "Invalid params" });
  const { username } = parsed.data;

  const currentUserId = getUserId(req);

  const [user] = await db.select().from(usersTable).where(eq(usersTable.username, username));
  if (!user) return res.status(404).json({ error: "User not found" });

  const [fc] = await db.select({ count: sql<number>`count(*)::int` }).from(followsTable).where(eq(followsTable.following_id, user.id));
  const [fing] = await db.select({ count: sql<number>`count(*)::int` }).from(followsTable).where(eq(followsTable.follower_id, user.id));
  const [pc] = await db.select({ count: sql<number>`count(*)::int` }).from(postsTable).where(eq(postsTable.author_id, user.id));

  let is_following = false;
  if (currentUserId) {
    const [follow] = await db.select().from(followsTable).where(and(eq(followsTable.follower_id, currentUserId), eq(followsTable.following_id, user.id)));
    is_following = !!follow;
  }

  return res.json({
    ...user,
    followers_count: fc?.count ?? 0,
    following_count: fing?.count ?? 0,
    posts_count: pc?.count ?? 0,
    is_following,
  });
});

router.get("/:userId/posts", async (req, res) => {
  const parsed = ListUserPostsParams.safeParse(req.params);
  if (!parsed.success) return res.status(400).json({ error: "Invalid params" });
  const { userId } = parsed.data;

  const currentUserId = getUserId(req);

  const posts = await db
    .select()
    .from(postsTable)
    .where(eq(postsTable.author_id, userId))
    .orderBy(sql`${postsTable.created_at} DESC`)
    .limit(20);

  const [author] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!author) return res.json({ posts: [], has_more: false, next_cursor: null });

  const postsWithData = await Promise.all(
    posts.map(async (post) => {
      const [lc] = await db.select({ count: sql<number>`count(*)::int` }).from(likesTable).where(eq(likesTable.post_id, post.id));
      const [cc] = await db.select({ count: sql<number>`count(*)::int` }).from(commentsTable).where(eq(commentsTable.post_id, post.id));
      let is_liked = false;
      if (currentUserId) {
        const [like] = await db.select().from(likesTable).where(and(eq(likesTable.post_id, post.id), eq(likesTable.user_id, currentUserId)));
        is_liked = !!like;
      }
      const [afc] = await db.select({ count: sql<number>`count(*)::int` }).from(followsTable).where(eq(followsTable.following_id, author.id));
      return {
        ...post,
        likes_count: lc?.count ?? 0,
        comments_count: cc?.count ?? 0,
        is_liked,
        author: { id: author.id, username: author.username, display_name: author.display_name, avatar_url: author.avatar_url, bio: author.bio, is_following: false, followers_count: afc?.count ?? 0 },
      };
    })
  );

  return res.json({ posts: postsWithData, has_more: false, next_cursor: null });
});

router.get("/:userId/followers", async (req, res) => {
  const parsed = GetFollowersParams.safeParse(req.params);
  if (!parsed.success) return res.status(400).json({ error: "Invalid" });
  const { userId } = parsed.data;
  const currentUserId = getUserId(req);

  const follows = await db.select().from(followsTable).where(eq(followsTable.following_id, userId));
  const users = await Promise.all(
    follows.map(async (f) => {
      const [u] = await db.select().from(usersTable).where(eq(usersTable.id, f.follower_id));
      if (!u) return null;
      const [fc] = await db.select({ count: sql<number>`count(*)::int` }).from(followsTable).where(eq(followsTable.following_id, u.id));
      let is_following = false;
      if (currentUserId) {
        const [fw] = await db.select().from(followsTable).where(and(eq(followsTable.follower_id, currentUserId), eq(followsTable.following_id, u.id)));
        is_following = !!fw;
      }
      return { ...u, followers_count: fc?.count ?? 0, is_following };
    })
  );
  return res.json(users.filter(Boolean));
});

router.get("/:userId/following", async (req, res) => {
  const parsed = GetFollowingParams.safeParse(req.params);
  if (!parsed.success) return res.status(400).json({ error: "Invalid" });
  const { userId } = parsed.data;
  const currentUserId = getUserId(req);

  const follows = await db.select().from(followsTable).where(eq(followsTable.follower_id, userId));
  const users = await Promise.all(
    follows.map(async (f) => {
      const [u] = await db.select().from(usersTable).where(eq(usersTable.id, f.following_id));
      if (!u) return null;
      const [fc] = await db.select({ count: sql<number>`count(*)::int` }).from(followsTable).where(eq(followsTable.following_id, u.id));
      let is_following = false;
      if (currentUserId) {
        const [fw] = await db.select().from(followsTable).where(and(eq(followsTable.follower_id, currentUserId), eq(followsTable.following_id, u.id)));
        is_following = !!fw;
      }
      return { ...u, followers_count: fc?.count ?? 0, is_following };
    })
  );
  return res.json(users.filter(Boolean));
});

export async function ensureUserExists(userId: string, email: string, username?: string, displayName?: string): Promise<void> {
  const [existing] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!existing) {
    const uname = username || email.split("@")[0].replace(/[^a-z0-9_]/gi, "_").toLowerCase();
    const dname = displayName || uname;
    await db.insert(usersTable).values({ id: userId, username: uname, display_name: dname }).onConflictDoNothing();
  }
}

export default router;
