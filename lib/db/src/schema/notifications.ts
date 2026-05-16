import { pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { postsTable } from "./posts";

export const notificationsTable = pgTable("notifications", {
  id: text("id").primaryKey(),
  user_id: text("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  actor_id: text("actor_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  post_id: text("post_id").references(() => postsTable.id, { onDelete: "cascade" }),
  post_content: text("post_content"),
  comment_content: text("comment_content"),
  is_read: boolean("is_read").notNull().default(false),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

export type Notification = typeof notificationsTable.$inferSelect;
