import { z } from 'zod';
import { insertPostSchema, posts } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
};

export const api = {
  posts: {
    list: {
      method: 'GET' as const,
      path: '/api/posts',
      responses: {
        200: z.array(z.custom<typeof posts.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/posts/:id',
      responses: {
        200: z.custom<typeof posts.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/posts',
      input: insertPostSchema,
      responses: {
        201: z.custom<typeof posts.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/posts/:id',
      responses: {
        200: z.object({ success: z.boolean() }),
        401: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      },
    },
  },
  ai: {
    suggest: {
      method: 'POST' as const,
      path: '/api/ai/suggest',
      input: z.object({ content: z.string() }),
      responses: {
        200: z.object({ suggestion: z.string() }),
        400: errorSchemas.validation,
      },
    },
  },
  auth: {
    check: {
      method: 'GET' as const,
      path: '/api/auth/check',
      responses: {
        200: z.object({ isAuthenticated: z.boolean() }),
      },
    },
    login: {
      method: 'POST' as const,
      path: '/api/auth/login',
      input: z.object({ password: z.string() }),
      responses: {
        200: z.object({ success: z.boolean() }),
        401: errorSchemas.unauthorized,
      },
    },
    logout: {
      method: 'POST' as const,
      path: '/api/auth/logout',
      responses: {
        200: z.object({ success: z.boolean() }),
      },
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

export type PostInput = z.infer<typeof api.posts.create.input>;
export type PostResponse = z.infer<typeof api.posts.create.responses[201]>;
