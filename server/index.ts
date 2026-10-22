import express from "express";
import { createServer } from "node:http";
import { randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { networkInterfaces } from "node:os";
import path from "node:path";
import { Server } from "socket.io";
import QRCode from "qrcode";
import { z } from "zod";
import { Store } from "./store";
import { Game } from "./game";
import type { Ack, Quiz } from "../shared/types";

const questionSchema = z.object({
  id: z.string().max(80).optional(),
  prompt: z.string().trim().min(1).max(600),
  options: z.array(z.string().trim().min(1).max(250)).length(4),
  correctIndex: z.number().int().min(0).max(3),
  seconds: z.number().int().min(5).max(120),
  points: z.number().int().min(10).max(2000),
});
const quizSchema = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().max(600).default(""),
  questions: z.array(questionSchema).min(1).max(100),
});
const createRoomSchema = z.object({
  quizId: z.string(),
  mode: z.enum(["individual", "teams"]),
  teams: z
    .array(z.string().trim().min(1).max(30))
    .min(2)
    .max(8)
    .default(["Team Sun", "Team Moon"]),
});

export async function startServer(options: {
  dataDir: string;
  staticDir: string;
  port?: number;
  hostToken?: string;
}) {
  const store = await Store.open(options.dataDir);
  const hostToken = options.hostToken ?? randomBytes(32).toString("hex");
  const validHost = (token: unknown) =>
    typeof token === "string" &&
    Buffer.byteLength(token) === Buffer.byteLength(hostToken) &&
    timingSafeEqual(Buffer.from(token), Buffer.from(hostToken));
  const app = express();
  app.disable("x-powered-by");
  app.use((_req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "no-referrer");
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' ws: wss:; frame-ancestors 'none'",
    );
    next();
  });
  app.use(express.json({ limit: "1mb" }));
  const http = createServer(app);
  const io = new Server(http, {
    maxHttpBufferSize: 16384,
    allowRequest: (req, cb) => {
      const origin = req.headers.origin;
      try {
        cb(null, !origin || new URL(origin).host === req.headers.host);
      } catch {
        cb(null, false);
      }
    },
  });
  let game: Game | null = null;
  let port = 0;
  function addresses() {
    const ips = [
      ...new Set(
        Object.values(networkInterfaces()).flatMap((list) =>
          (list ?? [])
            .filter(
              (x) =>
                x.family === "IPv4" &&
                !x.internal &&
                !x.address.startsWith("169.254."),
            )
            .map((x) => x.address),
        ),
      ),
    ];
    return ips.map((ip) => `http://${ip}:${port}/join`);
  }
  function broadcast() {
    for (const socket of io.sockets.sockets.values()) {
      if (socket.data.isHost) socket.emit("room:state", game?.view() ?? null);
      else if (game && socket.data.gameId === game.id && socket.data.playerId)
        socket.emit("room:state", game.view(socket.data.playerId));
    }
  }
  app.get("/api/health", (_req, res) => res.json({ ok: true }));
  app.get("/api/config", (_req, res) =>
    res.json({ port, addresses: addresses(), qr: null }),
  );
  app.get("/api/qr", async (req, res, next) => {
    try {
      const index = Number(req.query.index ?? 0);
      const address = addresses()[Number.isInteger(index) ? index : -1];
      if (!address) {
        res.status(404).end();
        return;
      }
      res
        .type("svg")
        .send(
          await QRCode.toString(address, {
            type: "svg",
            margin: 1,
            width: 220,
            color: { dark: "#172d31", light: "#ffffff" },
          }),
        );
    } catch (error) {
      next(error);
    }
  });
  app.use("/api", (req, res, next) => {
    if (!validHost(req.headers.authorization?.replace(/^Bearer /, ""))) {
      res
        .status(401)
        .json({ error: "Open the teacher link shown on the host laptop." });
      return;
    }
    res.setHeader("Cache-Control", "no-store");
    next();
  });
  app.get("/api/quizzes", (_req, res) => res.json(store.quizzes()));
  app.post("/api/quizzes", (req, res) => {
    const parsed = quizSchema.safeParse(req.body);
    if (!parsed.success) {
      res
        .status(400)
        .json({
          error:
            "Add a title and 1–100 questions, each with four answers, a correct answer, and a 5–120 second timer.",
        });
      return;
    }
    const id =
      typeof req.body.id === "string" && store.quiz(req.body.id)
        ? req.body.id
        : randomUUID();
    const quiz: Quiz = {
      ...parsed.data,
      id,
      updatedAt: new Date().toISOString(),
      questions: parsed.data.questions.map((q) => ({
        ...q,
        id: q.id ?? randomUUID(),
      })),
    };
    res.json(store.saveQuiz(quiz));
  });
  app.delete("/api/quizzes/:id", (req, res) => {
    store.deleteQuiz(String(req.params.id));
    res.json({ ok: true });
  });
  app.get("/api/results", (_req, res) => res.json(store.results()));
  app.get("/api/backup", (_req, res) =>
    res.json({ version: 1, quizzes: store.quizzes() }),
  );
  app.post("/api/import", (req, res) => {
    const parsed = z
      .object({ quizzes: z.array(quizSchema).min(1).max(200) })
      .safeParse(req.body);
    if (!parsed.success) {
      res
        .status(400)
        .json({ error: "Choose a QuizHost JSON backup with valid quizzes." });
      return;
    }
    for (const q of parsed.data.quizzes)
      store.saveQuiz({
        ...q,
        id: randomUUID(),
        updatedAt: new Date().toISOString(),
        questions: q.questions.map((question) => ({
          ...question,
          id: randomUUID(),
        })),
      });
    res.json({ count: parsed.data.quizzes.length });
  });
  app.use("/api", (_req, res) =>
    res.status(404).json({ error: "This action is unavailable." }),
  );
  app.use(express.static(options.staticDir, { index: false }));
  app.get(["/", "/host", "/join"], (_req, res) =>
    res.sendFile(path.resolve(options.staticDir, "index.html")),
  );
  app.use(
    (
      error: unknown,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      console.error(
        "Request failed:",
        error instanceof Error ? error.message : "Unknown error",
      );
      res
        .status(400)
        .json({
          error:
            "The request could not be completed. Check your input and try again.",
        });
    },
  );

  io.on("connection", (socket) => {
    socket.data.isHost = validHost(socket.handshake.auth?.hostToken);
    if (socket.data.isHost) socket.emit("room:state", game?.view() ?? null);
    function on<T>(
      event: string,
      action: (payload: T) => unknown,
      hostOnly = false,
    ) {
      socket.on(event, (payload: T, ack?: (result: Ack<unknown>) => void) => {
        if (typeof ack !== "function") return;
        try {
          if (hostOnly && !socket.data.isHost)
            throw new Error("Only the teacher can control this game.");
          const data = action(payload);
          ack({ ok: true, data });
          broadcast();
        } catch (error) {
          ack({
            ok: false,
            error: error instanceof Error ? error.message : "Please try again.",
          });
        }
      });
    }
    on(
      "host:create",
      (payload: unknown) => {
        const parsed = createRoomSchema.parse(payload);
        if (game && game.phase !== "finished")
          throw new Error("End the current room before opening another.");
        const quiz = store.quiz(parsed.quizId);
        if (!quiz) throw new Error("That quiz no longer exists.");
        if (
          new Set(parsed.teams.map((n) => n.toLowerCase())).size !==
          parsed.teams.length
        )
          throw new Error("Give each team a different name.");
        if (game) {
          game.dispose();
          for (const s of io.sockets.sockets.values())
            if (!s.data.isHost && s.data.gameId === game.id)
              s.emit("room:closed");
        }
        game = new Game(quiz, parsed.mode, parsed.teams, broadcast, (result) =>
          store.saveResult(result),
        );
      },
      true,
    );
    function current() {
      if (!game) throw new Error("Open a game room first.");
      return game;
    }
    on("host:start", () => current().start(), true);
    on("host:reveal", () => current().reveal(), true);
    on("host:next", () => current().next(), true);
    on(
      "host:pick",
      (payload: unknown) => current().pick(z.number().int().parse(payload)),
      true,
    );
    on(
      "host:award",
      (payload: unknown) => current().award(z.boolean().parse(payload)),
      true,
    );
    on("host:end", () => current().finish(), true);
    on(
      "host:close",
      () => {
        if (game) {
          if (game.phase !== "lobby" && game.phase !== "finished")
            throw new Error("End the game before closing the room.");
          game.dispose();
          for (const s of io.sockets.sockets.values())
            if (!s.data.isHost && s.data.gameId === game.id)
              s.emit("room:closed");
        }
        game = null;
      },
      true,
    );
    on("player:join", (payload: unknown) => {
      const data = z
        .object({
          pin: z.string().regex(/^\d{6}$/),
          name: z.string().trim().min(1).max(30),
          token: z.string().max(80).optional(),
        })
        .parse(payload);
      const room = current();
      if (data.pin !== room.pin)
        throw new Error(
          "No room with that PIN is open. Check with your teacher.",
        );
      if (socket.data.isHost)
        throw new Error("Open the student page in another tab to join.");
      const player = room.join(data.name, data.token, socket.id);
      socket.data.gameId = room.id;
      socket.data.playerId = player.id;
      return {
        id: player.id,
        token: player.token,
        name: player.name,
        pin: room.pin,
        room: room.view(player.id),
      };
    });
    on("player:answer", (payload: unknown) => {
      if (socket.data.gameId !== current().id)
        throw new Error("Rejoin the current game.");
      current().answer(
        socket.data.playerId,
        socket.id,
        z.number().int().min(0).max(3).parse(payload),
      );
    });
    socket.on("disconnect", () => {
      game?.disconnect(socket.id);
      broadcast();
    });
  });
  try {
    await new Promise<void>((resolve, reject) => {
      http.once("error", reject);
      http.listen(options.port ?? 3210, "0.0.0.0", () => {
        http.off("error", reject);
        resolve();
      });
    });
  } catch (error) {
    io.close();
    store.close();
    throw error;
  }
  port = (http.address() as { port: number }).port;
  return {
    port,
    hostToken,
    hostURL: `http://127.0.0.1:${port}/host#host=${hostToken}`,
    joinURL: `http://127.0.0.1:${port}/join`,
    store,
    async close() {
      game?.dispose();
      await new Promise<void>((resolve) => io.close(() => resolve()));
      store.close();
    },
  };
}
