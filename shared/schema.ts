import { pgTable, text, serial, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  title: text("title"),
  content: text("content").notNull(),
  coverImageUrl: text("cover_image_url"),
  bodyImageUrl: text("body_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  isVisible: boolean("is_visible").default(true),
});

export const insertPostSchema = createInsertSchema(posts, {
  title: z.string().optional().nullable(),
  content: z.string().min(1, "O conteúdo é obrigatório"),
  coverImageUrl: z.string().optional().nullable(),
  bodyImageUrl: z.string().optional().nullable(),
  isVisible: z.boolean().optional(),
}).omit({ 
  id: true, 
  createdAt: true 
});

export type Post = typeof posts.$inferSelect;
export type InsertPost = z.infer<typeof insertPostSchema>;

export type CreatePostRequest = InsertPost;
export type UpdatePostRequest = Partial<InsertPost>;

export type PostResponse = Post;
