import { pgTable, text, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  id: text("id").primaryKey(),
  username: text("username").notNull().unique(),
  display_name: text("display_name").notNull(),
  bio: text("bio"),
  avatar_url: text("avatar_url"),
  website: text("website"),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

export const followsTable = pgTable("follows", {
  follower_id: text("follower_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  following_id: text("following_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ created_at: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
export type Follow = typeof followsTable.$inferSelect;

export const followerCountView = pgTable("follower_counts", {
  user_id: text("user_id"),
  followers_count: integer("followers_count"),
  following_count: integer("following_count"),
});
