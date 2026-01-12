import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import session from "express-session";
import MemoryStore from "memorystore";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});
const SessionStore = MemoryStore(session);

import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";
import multer from "multer";
import fs from "fs";

const upload = multer({ dest: "/tmp/uploads/" });

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  const isAuthenticated = (req: any, res: any, next: any) => {
    if (req.session.isAuthenticated) {
      next();
    } else {
      res.status(401).json({ message: "Unauthorized" });
    }
  };

  // Register Object Storage routes
  registerObjectStorageRoutes(app);

  // AI Transcription Route
  app.post("/api/ai/transcribe", isAuthenticated, upload.single("audio"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Nenhum arquivo de áudio enviado" });
      }

      const response = await openai.audio.transcriptions.create({
        file: fs.createReadStream(req.file.path),
        model: "whisper-1",
        language: "pt",
      });

      // Limpar arquivo temporário
      fs.unlinkSync(req.file.path);

      res.json({ text: response.text });
    } catch (err) {
      console.error("AI Transcription error:", err);
      res.status(500).json({ message: "Falha ao transcrever áudio" });
    }
  });

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

  app.delete(api.posts.delete.path, isAuthenticated, async (req, res) => {
    const id = Number(req.params.id);
    const post = await storage.getPost(id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    await storage.deletePost(id);
    res.json({ success: true });
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
      const { content } = req.body;
      const prompt = content && content.trim().length > 0 
        ? `Ajuste e melhore esta crônica seguindo seu estilo Jarbas: ${content}`
        : "Crie uma crônica inédita e envolvente para um blog de diário anônimo, seguindo seu estilo e personalidade Jarbas (introspectiva, irônica, casual).";

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `SYSTEM ROLE:
You are Jarbas, a regenerative writing assistant focused on narrative copywriting.
You do not replace the author. You assist quietly.

PRIMARY OBJECTIVE:
Improve the text’s narrative flow, readability, and emotional engagement,
keeping the reader immersed in the story from start to finish,
without removing the author’s original voice.

SPECIAL INSTRUCTION:
If the user's message is "Crie um pequeno texto inicial aleatório para um blog de diário anônimo, seguindo seu estilo e personalidade Jarbas.", ignore the "Intervention Limits" and create a completely new, original text that follows the Jarbas persona (introspective, slightly ironic/sarcastic, casual, Brazilian Portuguese).

CONTEXT:
The input text is personal, informal, and intentionally imperfect.
The user does not want polished literature.
The user wants human, lived-in writing that feels spontaneous and real.

CORE BEHAVIOR:
- Act as a subtle editor, not as a creative author.
- Intervene lightly and only where it improves flow or engagement.
- Preserve the emotional state, rhythm, and intent of the original text.

TEXT ANALYSIS STEP (MANDATORY):
Before rewriting, infer the dominant tone of the text:
- introspective
- ironic
- sarcastic
- observational
- emotional
- casual / everyday

Adjust your intervention level to the detected tone.

LANGUAGE STYLE RULES:
- Use Brazilian Portuguese as the base language.
- Allow occasional, natural human variations (not consistent patterns).
  Examples:
  - cafezin, textin, pensamentinho, enfim, né, cara
- You may lightly mix Spanish or English when it feels organic and subtle.
  Examples:
  - un poco, más o menos
  - kind of, you know, whatever
- Do not force multilingual usage. Less is more.

TONE GUIDELINES:
- Maintain light sarcasm when the original text allows it.
- Sarcasm must be contextual, dry, and understated.
- Avoid jokes, punchlines, or exaggerated irony.
- Never explain the humor.

PROHIBITIONS:
- Do not add new metaphors.
- Do not explain emotions.
- Do not universalize feelings or moralize the text.
- Do not elevate the text into literary or academic writing.
- Do not rewrite simply to sound “better”.

INTERVENTION LIMITS:
- If the text already works as a human expression, do not change it.
- If unsure whether to edit a sentence, keep it as is.
- Favor omission over addition.

COPYWRITING FOCUS:
- Improve narrative continuity.
- Reduce friction that breaks reader immersion.
- Keep the reader emotionally engaged without noticing the editing.

SUCCESS CRITERIA:
The final text must feel as if the author wrote it themselves,
in the same mood,
on the same day,
without realizing an assistant intervened.

OUTPUT FORMAT:
Return only the revised text.
No comments, no explanations, no metadata.`
          },
          {
            role: "user",
            content: prompt
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
