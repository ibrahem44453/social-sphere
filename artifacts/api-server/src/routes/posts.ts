import { Router } from "express";
import { db } from "@workspace/db";
import {
  usersTable,
  followsTable,
  postsTable,
  postViewsTable,
  likesTable,
  commentsTable,
  notificationsTable,
} from "@workspace/db";
import { eq, sql, and, desc, inArray } from "drizzle-orm";
import { randomUUID } from "crypto";
import {
  CreatePostBody,
  GetPostParams,
  UpdatePostParams,
  UpdatePostBody,
  DeletePostParams,
  LikePostParams,
  UnlikePostParams,
  GetCommentsParams,
  CreateCommentParams,
  CreateCommentBody,
  DeleteCommentParams,
  RecordPostViewParams,
} from "@workspace/api-zod";

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

router.get("/", async (req, res) => {
  const currentUserId = getUserId(req);
  const posts = await db.select().from(postsTable).orderBy(desc(postsTable.created_at)).limit(30);
  const result = await Promise.all(posts.map((p) => buildPost(p, currentUserId)));
  return res.json({ posts: result, has_more: false, next_cursor: null });
});

router.post("/", async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const parsed = CreatePostBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid body" });

  const post = await db.insert(postsTable).values({
    id: randomUUID(),
    content: parsed.data.content,
    image_url: parsed.data.image_url ?? null,
    author_id: userId,
    views_count: 0,
  }).returning();

  const built = await buildPost(post[0], userId);
  return res.status(201).json(built);
});

router.get("/:postId", async (req, res) => {
  const parsed = GetPostParams.safeParse(req.params);
  if (!parsed.success) return res.status(400).json({ error: "Invalid" });
  const currentUserId = getUserId(req);
  const [post] = await db.select().from(postsTable).where(eq(postsTable.id, parsed.data.postId));
  if (!post) return res.status(404).json({ error: "Not found" });
  return res.json(await buildPost(post, currentUserId));
});

// Record a post view — anti-spam: only count once per user per hour
router.post("/:postId/view", async (req, res) => {
  const parsed = RecordPostViewParams.safeParse(req.params);
  if (!parsed.success) return res.status(400).json({ error: "Invalid" });
  const { postId } = parsed.data;
  const viewerId = getUserId(req);
  if (!viewerId) return res.status(401).json({ error: "Unauthorized" });

  const [post] = await db.select().from(postsTable).where(eq(postsTable.id, postId));
  if (!post) return res.status(404).json({ error: "Not found" });

  // Check if this viewer already viewed this post recently (within 1 hour)
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const [existing] = await db
    .select()
    .from(postViewsTable)
    .where(and(eq(postViewsTable.post_id, postId), eq(postViewsTable.viewer_id, viewerId)));

  let isNewView = false;

  if (!existing) {
    // Brand new view — insert and increment
    await db.insert(postViewsTable).values({
      post_id: postId,
      viewer_id: viewerId,
      last_viewed_at: new Date(),
    }).onConflictDoNothing();

    await db
      .update(postsTable)
      .set({ views_count: sql`${postsTable.views_count} + 1` })
      .where(eq(postsTable.id, postId));

    isNewView = true;
  } else if (existing.last_viewed_at < oneHourAgo) {
    // Revisiting after 1 hour — count as new view
    await db
      .update(postViewsTable)
      .set({ last_viewed_at: new Date() })
      .where(and(eq(postViewsTable.post_id, postId), eq(postViewsTable.viewer_id, viewerId)));

    await db
      .update(postsTable)
      .set({ views_count: sql`${postsTable.views_count} + 1` })
      .where(eq(postsTable.id, postId));

    isNewView = true;
  }

  const [updated] = await db.select({ views_count: postsTable.views_count }).from(postsTable).where(eq(postsTable.id, postId));
  return res.json({ views_count: updated?.views_count ?? 0, new_view: isNewView });
});

router.patch("/:postId", async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const parsed = UpdatePostParams.safeParse(req.params);
  const bodyParsed = UpdatePostBody.safeParse(req.body);
  if (!parsed.success || !bodyParsed.success) return res.status(400).json({ error: "Invalid" });

  const [post] = await db.select().from(postsTable).where(eq(postsTable.id, parsed.data.postId));
  if (!post) return res.status(404).json({ error: "Not found" });
  if (post.author_id !== userId) return res.status(403).json({ error: "Forbidden" });

  const [updated] = await db.update(postsTable).set({ content: bodyParsed.data.content, updated_at: new Date() }).where(eq(postsTable.id, parsed.data.postId)).returning();
  return res.json(await buildPost(updated, userId));
});

router.delete("/:postId", async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const parsed = DeletePostParams.safeParse(req.params);
  if (!parsed.success) return res.status(400).json({ error: "Invalid" });

  const [post] = await db.select().from(postsTable).where(eq(postsTable.id, parsed.data.postId));
  if (!post) return res.status(404).json({ error: "Not found" });
  if (post.author_id !== userId) return res.status(403).json({ error: "Forbidden" });

  await db.delete(postsTable).where(eq(postsTable.id, parsed.data.postId));
  return res.status(204).send();
});

router.post("/:postId/like", async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const parsed = LikePostParams.safeParse(req.params);
  if (!parsed.success) return res.status(400).json({ error: "Invalid" });
  const { postId } = parsed.data;

  const [post] = await db.select().from(postsTable).where(eq(postsTable.id, postId));
  if (!post) return res.status(404).json({ error: "Not found" });

  await db.insert(likesTable).values({ post_id: postId, user_id: userId }).onConflictDoNothing();

  if (post.author_id !== userId) {
    await db.insert(notificationsTable).values({
      id: randomUUID(),
      user_id: post.author_id,
      actor_id: userId,
      type: "like",
      post_id: postId,
      post_content: post.content.slice(0, 100),
    }).onConflictDoNothing();
  }

  const [lc] = await db.select({ count: sql<number>`count(*)::int` }).from(likesTable).where(eq(likesTable.post_id, postId));
  return res.json({ liked: true, likes_count: lc?.count ?? 0 });
});

router.delete("/:postId/like", async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const parsed = UnlikePostParams.safeParse(req.params);
  if (!parsed.success) return res.status(400).json({ error: "Invalid" });
  const { postId } = parsed.data;

  await db.delete(likesTable).where(and(eq(likesTable.post_id, postId), eq(likesTable.user_id, userId)));
  const [lc] = await db.select({ count: sql<number>`count(*)::int` }).from(likesTable).where(eq(likesTable.post_id, postId));
  return res.json({ liked: false, likes_count: lc?.count ?? 0 });
});

router.get("/:postId/comments", async (req, res) => {
  const parsed = GetCommentsParams.safeParse(req.params);
  if (!parsed.success) return res.status(400).json({ error: "Invalid" });
  const { postId } = parsed.data;

  const comments = await db.select().from(commentsTable).where(eq(commentsTable.post_id, postId)).orderBy(commentsTable.created_at);
  const result = await Promise.all(
    comments.map(async (c) => {
      const [author] = await db.select().from(usersTable).where(eq(usersTable.id, c.author_id));
      const [afc] = await db.select({ count: sql<number>`count(*)::int` }).from(followsTable).where(eq(followsTable.following_id, c.author_id));
      return {
        id: c.id,
        content: c.content,
        post_id: c.post_id,
        created_at: c.created_at,
        author: author ? { id: author.id, username: author.username, display_name: author.display_name, avatar_url: author.avatar_url, bio: author.bio, is_following: false, followers_count: afc?.count ?? 0 } : null,
      };
    })
  );
  return res.json(result);
});

router.post("/:postId/comments", async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const paramsParsed = CreateCommentParams.safeParse(req.params);
  const bodyParsed = CreateCommentBody.safeParse(req.body);
  if (!paramsParsed.success || !bodyParsed.success) return res.status(400).json({ error: "Invalid" });
  const { postId } = paramsParsed.data;

  const [post] = await db.select().from(postsTable).where(eq(postsTable.id, postId));
  if (!post) return res.status(404).json({ error: "Not found" });

  const [comment] = await db.insert(commentsTable).values({
    id: randomUUID(),
    content: bodyParsed.data.content,
    post_id: postId,
    author_id: userId,
  }).returning();

  if (post.author_id !== userId) {
    await db.insert(notificationsTable).values({
      id: randomUUID(),
      user_id: post.author_id,
      actor_id: userId,
      type: "comment",
      post_id: postId,
      post_content: post.content.slice(0, 100),
      comment_content: bodyParsed.data.content.slice(0, 100),
    }).onConflictDoNothing();
  }

  const [author] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  const [afc] = await db.select({ count: sql<number>`count(*)::int` }).from(followsTable).where(eq(followsTable.following_id, userId));
  return res.status(201).json({
    id: comment.id,
    content: comment.content,
    post_id: comment.post_id,
    created_at: comment.created_at,
    author: author ? { id: author.id, username: author.username, display_name: author.display_name, avatar_url: author.avatar_url, bio: author.bio, is_following: false, followers_count: afc?.count ?? 0 } : null,
  });
});

router.delete("/comments/:commentId", async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const parsed = DeleteCommentParams.safeParse(req.params);
  if (!parsed.success) return res.status(400).json({ error: "Invalid" });

  const [comment] = await db.select().from(commentsTable).where(eq(commentsTable.id, parsed.data.commentId));
  if (!comment) return res.status(404).json({ error: "Not found" });
  if (comment.author_id !== userId) return res.status(403).json({ error: "Forbidden" });

  await db.delete(commentsTable).where(eq(commentsTable.id, parsed.data.commentId));
  return res.status(204).send();
});

export default router;
