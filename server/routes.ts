import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import session from "express-session";
import MemoryStore from "memorystore";

const SessionStore = MemoryStore(session);

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Auth Middleware
  app.use(
    session({
      cookie: { maxAge: 86400000 },
      store: new SessionStore({
        checkPeriod: 86400000,
      }),
      resave: false,
      saveUninitialized: false,
      secret: process.env.SESSION_SECRET || "secret_key",
    })
  );

  const isAuthenticated = (req: any, res: any, next: any) => {
    if (req.session.isAuthenticated) {
      next();
    } else {
      res.status(401).json({ message: "Unauthorized" });
    }
  };

  // API Routes
  app.get(api.posts.list.path, async (req, res) => {
    const posts = await storage.getPosts();
    // In a real anonymous diary, we might want to filter out hidden posts for public
    // But for admin we see all. Let's just return all for now or filter in frontend.
    // The requirement says "Indexar apenas páginas públicas" and "Área administrativa (secreta)".
    res.json(posts);
  });

  app.get(api.posts.get.path, async (req, res) => {
    const post = await storage.getPost(Number(req.params.id));
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    res.json(post);
  });

  app.post(api.posts.create.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.posts.create.input.parse(req.body);
      const post = await storage.createPost(input);
      res.status(201).json(post);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  // Auth Routes
  app.get(api.auth.check.path, (req, res) => {
    res.json({ isAuthenticated: !!(req.session as any).isAuthenticated });
  });

  app.post(api.auth.login.path, (req, res) => {
    const { password } = req.body;
    // Simple hardcoded password for the "secret" login as requested
    // In production, use env var.
    const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
    
    if (password === adminPassword) {
      (req.session as any).isAuthenticated = true;
      res.json({ success: true });
    } else {
      res.status(401).json({ message: "Invalid password" });
    }
  });

  app.post(api.auth.logout.path, (req, res) => {
    req.session.destroy(() => {
      res.json({ success: true });
    });
  });

  // AI Routes
  app.post(api.ai.suggest.path, isAuthenticated, async (req, res) => {
    try {
      const { content } = api.ai.suggest.input.parse(req.body);
      
      const response = await (app as any).openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "Você é um assistente de escrita para um diário editorial. Sua tarefa é fornecer sugestões sutis de fluidez, correção ortográfica e ajustes leves de clareza. NUNCA reescreva o texto por completo. Mantenha o tom autoral, íntimo, melancólico ou ácido do usuário. Retorne apenas o texto sugerido, sem explicações."
          },
          {
            role: "user",
            content: content
          }
        ],
        max_tokens: 2000,
      });

      res.json({ suggestion: response.choices[0].message.content });
    } catch (err) {
      console.error("AI Suggestion error:", err);
      res.status(500).json({ message: "Failed to generate AI suggestion" });
    }
  });

  // Seed Data
  await seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  const posts = await storage.getPosts();
  if (posts.length === 0) {
    await storage.createPost({
      title: "O começo de nada",
      content: "Hoje acordei e percebi que não sei escrever. Mas a necessidade de registrar o vazio é maior que a vergonha. Estou em trânsito, sempre em trânsito, mesmo quando estou parado. Este é um caderno de notas sobre lugares que não existem mais, ou que nunca existiram.",
      isVisible: true
    });
    
    await storage.createPost({
      title: "Café frio em Lisboa",
      content: "A chuva bate na janela do elétrico 28. O café esfriou enquanto eu olhava para a calçada portuguesa molhada. As pessoas correm com seus guarda-chuvas pretos, formigas fugindo de uma lupa gigante. Sinto saudade de algo que não sei nomear. Talvez seja apenas fome, ou a falta de um propósito claro.",
      isVisible: true
    });

    await storage.createPost({
      title: "Sem título",
      content: "Escrever é sangrar em silêncio. Ninguém lê, ninguém se importa, e isso é a única liberdade que me resta.",
      isVisible: true
    });
  }
}
