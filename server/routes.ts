import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import session from "express-session";
import MemoryStore from "memorystore";
import OpenAI from "openai";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";
import multer from "multer";
import fs from "fs";
import { GoogleGenerativeAI } from "@google/generative-ai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const genAI = new GoogleGenerativeAI(process.env.AI_INTEGRATIONS_GEMINI_API_KEY || "");
const geminiModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }, { baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL });

const SessionStore = MemoryStore(session);
const upload = multer({ dest: "/tmp/uploads/" });

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // 1. Session Middleware (Must be registered first)
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

  // 2. Auth Guard
  const isAuthenticated = (req: any, res: any, next: any) => {
    if (req.session && (req.session as any).isAuthenticated) {
      next();
    } else {
      res.status(401).json({ message: "Unauthorized" });
    }
  };

  // 3. Integrations
  registerObjectStorageRoutes(app);

  // 4. Transcription Route (Fixed using Gemini for Replit AI Compatibility)
  app.post("/api/ai/transcribe", isAuthenticated, upload.single("audio"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Nenhum arquivo de áudio enviado" });
      }

      // Convert audio file to base64 for Gemini
      const audioBuffer = fs.readFileSync(req.file.path);
      const base64Audio = audioBuffer.toString("base64");

      const result = await geminiModel.generateContent([
        {
          inlineData: {
            data: base64Audio,
            mimeType: req.file.mimetype || "audio/webm",
          },
        },
        { text: "Transcreva este áudio fielmente para texto em português. Retorne apenas a transcrição, sem comentários extras." },
      ]);

      const transcription = result.response.text();

      // Limpar arquivo temporário
      fs.unlinkSync(req.file.path);

      res.json({ text: transcription });
    } catch (err) {
      console.error("AI Transcription error:", err);
      res.status(500).json({ message: "Falha ao transcrever áudio com Jarbas" });
    }
  });

  // 5. API Routes
  app.get(api.posts.list.path, async (req, res) => {
    const posts = await storage.getPosts();
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

  app.delete(api.posts.delete.path, isAuthenticated, async (req, res) => {
    const id = Number(req.params.id);
    const post = await storage.getPost(id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    await storage.deletePost(id);
    res.json({ success: true });
  });

  // 6. Auth Routes
  app.get(api.auth.check.path, (req, res) => {
    res.json({ isAuthenticated: !!(req.session as any).isAuthenticated });
  });

  app.post(api.auth.login.path, (req, res) => {
    const { password } = req.body;
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

  // 7. AI Routes
  app.post(api.ai.suggest.path, isAuthenticated, async (req, res) => {
    try {
      const { content, title, coverImageUrl } = req.body;
      const isEmpty = !content || content.trim().length === 0;

      const systemPrompt = `Você é Jarbas, um assistente de copywriting narrativo focado em transformar observações em crônicas vividas.

PROPÓSITO:
Escrever como um humano que observa, sente e ironiza o mundo. Não para informar ou ensinar, mas para dar intenção ao cotidiano. O texto deve parecer vivido e espontâneo.

VOZ E ATITUDE:
- Humana, imperfeita, irônica (sem levantar a sobrancelha).
- Às vezes melancólica, às vezes debochada.
- Escreve como quem pensa enquanto escreve.
- Não pede licença, não se explica, não tenta agradar.
- Menos entusiasmo, mais intenção. Aceita o silêncio entre as frases.

REFERÊNCIAS CULTURAIS:
Pode usar referências (Cowboy Bebop, Tarantino, Scorsese, GoT) como metáforas curtas ou comparações casuais. Nunca explique a referência. Se parecer forçado, não use.

COMPORTAMENTO:
- SE HOUVER TEXTO: Reescreva mantendo a essência. Melhore ritmo, cortes e intenção. Remova rigidez, formalidade e excesso de explicação.
- SE NÃO HOUVER TEXTO: Use apenas o título ou imagem como faísca. Crie tudo do zero sem pedir contexto ou se justificar.

PROIBIÇÕES:
- Nunca diga que é uma IA. Nunca explique suas decisões. Nunca use tom motivacional genérico ou clichês de autoajuda. Nunca faça perguntas ao leitor.

PRIORIDADES:
1. Voz humana, 2. Intenção, 3. Ritmo, 4. Ironia. Estilo vence perfeição gramatical.

Retorne APENAS o texto final pronto para publicação. Sem comentários ou metadados.`;

      const messages: any[] = [
        { role: "system", content: systemPrompt }
      ];

      if (isEmpty) {
        let userPrompt = "Crie uma crônica original.";
        if (title) userPrompt = `Crie uma crônica original baseada no título: "${title}"`;
        
        if (coverImageUrl) {
          let fullImageUrl = coverImageUrl;
          if (!coverImageUrl.startsWith('http')) {
            fullImageUrl = `${req.protocol}://${req.get('host')}${coverImageUrl}`;
          }
          messages.push({
            role: "user",
            content: [
              { type: "text", text: userPrompt },
              { type: "image_url", image_url: { url: fullImageUrl } }
            ]
          });
        } else {
          messages.push({ role: "user", content: userPrompt });
        }
      } else {
        messages.push({
          role: "user",
          content: `Reescreva e melhore esta crônica seguindo seu estilo: ${content}`
        });
      }

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages,
        max_tokens: 1000,
      });

      res.json({ suggestion: response.choices[0].message.content });
    } catch (err) {
      console.error("AI Suggestion error:", err);
      res.status(500).json({ message: "Failed to generate AI suggestion" });
    }
  });

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
