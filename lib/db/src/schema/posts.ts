import { pgTable, text, timestamp, integer, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const postsTable = pgTable("posts", {
  id: text("id").primaryKey(),
  content: text("content").notNull(),
  image_url: text("image_url"),
  author_id: text("author_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  views_count: integer("views_count").notNull().default(0),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at"),
});

export const postViewsTable = pgTable("post_views", {
  post_id: text("post_id").notNull().references(() => postsTable.id, { onDelete: "cascade" }),
  viewer_id: text("viewer_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  last_viewed_at: timestamp("last_viewed_at").notNull().defaultNow(),
}, (t) => [primaryKey({ columns: [t.post_id, t.viewer_id] })]);

export const likesTable = pgTable("likes", {
  post_id: text("post_id").notNull().references(() => postsTable.id, { onDelete: "cascade" }),
  user_id: text("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

export const commentsTable = pgTable("comments", {
  id: text("id").primaryKey(),
  content: text("content").notNull(),
  post_id: text("post_id").notNull().references(() => postsTable.id, { onDelete: "cascade" }),
  author_id: text("author_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

export const insertPostSchema = createInsertSchema(postsTable).omit({ created_at: true, updated_at: true, views_count: true });
export type InsertPost = z.infer<typeof insertPostSchema>;
export type Post = typeof postsTable.$inferSelect;
export type PostView = typeof postViewsTable.$inferSelect;
export type Like = typeof likesTable.$inferSelect;
export type Comment = typeof commentsTable.$inferSelect;
