import express from "express";
import { createServer } from "node:http";
import { randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { networkInterfaces } from "node:os";
import path from "node:path";
import { Server } from "socket.io";
import QRCode from "qrcode";
import { z } from "zod";
import { Store } from "./store";
import { Game, type GameTimings } from "./game";
import { MediaStore } from "./media";
import { backupSchema, quizSchema } from "./quizValidation";
import { MAX_BACKUP_BYTES, MAX_IMAGE_BYTES } from "../shared/media";
import type { Ack, JoinNotice, Quiz } from "../shared/types";
import { teamActionSchema, teamConfigSchema } from "./team/validation";

const createRoomSchema = z.object({
  quizId: z.string(),
  mode: z.enum(["individual", "teams"]),
  teamGame: teamConfigSchema.optional(),
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
  timings?: Partial<GameTimings>;
  networkInterfaces?: typeof networkInterfaces;
}) {
  const store = await Store.open(options.dataDir);
  const media = new MediaStore(options.dataDir);
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
  function connections() {
    const seen = new Set<string>();
    return Object.entries(
      (options.networkInterfaces ?? networkInterfaces)(),
    ).flatMap(([name, list]) =>
      (list ?? []).flatMap((item) => {
        if (
          item.family !== "IPv4" ||
          item.internal ||
          item.address.startsWith("169.254.") ||
          seen.has(item.address)
        )
          return [];
        seen.add(item.address);
        return [{ name, url: `http://${item.address}:${port}/join` }];
      }),
    );
  }
  function broadcast() {
    for (const socket of io.sockets.sockets.values()) {
      if (socket.data.isHost) socket.emit("room:state", game?.view() ?? null);
      else if (game && socket.data.gameId === game.id && socket.data.playerId)
        socket.emit("room:state", game.view(socket.data.playerId));
    }
  }
  app.get("/api/health", (_req, res) => res.json({ ok: true }));
  app.get("/media/:id", (req, res) => {
    const id = String(req.params.id);
    if (!media.has(id)) {
      res.status(404).end();
      return;
    }
    res.setHeader("Cross-Origin-Resource-Policy", "same-origin");
    res.type(media.contentType(id)).sendFile(media.file(id), {
      maxAge: "1y",
      immutable: true,
      dotfiles: "allow",
    });
  });
  app.get("/api/config", (_req, res) => {
    const interfaces = connections();
    res.setHeader("Cache-Control", "no-store");
    res.json({
      port,
      addresses: interfaces.map((item) => item.url),
      interfaces,
      qr: null,
    });
  });
  app.get("/api/qr", async (req, res, next) => {
    try {
      res.setHeader("Cache-Control", "no-store");
      const addresses = connections().map((item) => item.url);
      const index = Number(req.query.index ?? 0);
      const requested = req.query.address;
      if (requested !== undefined && typeof requested !== "string") {
        res.status(400).end();
        return;
      }
      // Bind a new client's QR to its selected URL, not a changing adapter index.
      // Keep the index parameter for older clients, and reject arbitrary URLs.
      const address =
        requested === undefined
          ? addresses[Number.isInteger(index) ? index : -1]
          : addresses.find((candidate) => candidate === requested);
      if (!address) {
        res.status(404).end();
        return;
      }
      res.type("svg").send(
        await QRCode.toString(address, {
          type: "svg",
          margin: 1,
          width: 220,
          color: { dark: "#2b0b59", light: "#ffce3b" },
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
  app.use("/api/import", express.json({ limit: MAX_BACKUP_BYTES }));
  app.use(express.json({ limit: "1mb" }));
  app.post(
    "/api/images",
    express.raw({
      type: ["image/png", "image/jpeg", "image/webp"],
      limit: MAX_IMAGE_BYTES,
    }),
    (req, res) => {
      if (!Buffer.isBuffer(req.body)) {
        res.status(400).json({ error: "Choose a JPG, PNG, or WebP image." });
        return;
      }
      try {
        res.json({
          id: media.save(
            req.body,
            req.get("content-type")?.split(";")[0] ?? "",
          ),
        });
      } catch (error) {
        res.status(400).json({ error: (error as Error).message });
      }
    },
  );
  app.post("/api/quizzes", (req, res) => {
    const parsed = quizSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error:
          "Add a title and 1–100 questions, each with four answers, a correct answer, and a 5–120 second timer.",
      });
      return;
    }
    const id =
      typeof req.body.id === "string" && store.quiz(req.body.id)
        ? req.body.id
        : randomUUID();
    if (parsed.data.questions.some((q) => q.image && !media.has(q.image.id))) {
      res.status(400).json({
        error: "An image is missing. Add it again before saving the quiz.",
      });
      return;
    }
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
    res.json({
      version: 2,
      quizzes: store.quizzes(),
      images: media.backup(
        store
          .quizzes()
          .flatMap((q) =>
            q.questions.flatMap((question) =>
              question.image ? [question.image.id] : [],
            ),
          ),
      ),
    }),
  );
  app.post("/api/import", (req, res) => {
    const parsed = backupSchema.safeParse(req.body);
    if (!parsed.success) {
      res
        .status(400)
        .json({ error: "Choose a QuizHost JSON backup with valid quizzes." });
      return;
    }
    try {
      media.restore(
        parsed.data.images,
        parsed.data.quizzes.flatMap((q) =>
          q.questions.flatMap((question) =>
            question.image ? [question.image.id] : [],
          ),
        ),
      );
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
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
      if ((error as { type?: string })?.type === "entity.too.large") {
        res.status(413).json({
          error:
            _req.path === "/api/import"
              ? "Choose a quiz backup up to 40 MB."
              : "This image is too large. Choose an image up to 2 MB after resizing.",
        });
        return;
      }
      console.error(
        "Request failed:",
        error instanceof Error ? error.message : "Unknown error",
      );
      res.status(400).json({
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
        const nextGame = new Game(
          quiz,
          parsed.mode,
          parsed.teams,
          broadcast,
          (result) => store.saveResult(result),
          options.timings,
          parsed.mode === "teams" ? parsed.teamGame : undefined,
        );
        if (game) {
          game.dispose();
          for (const s of io.sockets.sockets.values())
            if (!s.data.isHost && s.data.gameId === game.id)
              s.emit("room:closed");
        }
        game = nextGame;
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
    on(
      "host:team-action",
      (payload: unknown) =>
        current().teamAction(teamActionSchema.parse(payload)),
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
      const previousCount = room.players.size;
      const player = room.join(data.name, data.token, socket.id);
      socket.data.gameId = room.id;
      socket.data.playerId = player.id;
      if (room.players.size > previousCount) {
        const notice: JoinNotice = {
          id: randomUUID(),
          roomId: room.id,
          player: { id: player.id, name: player.name, avatar: player.avatar },
        };
        for (const recipient of io.sockets.sockets.values()) {
          if (recipient.data.isHost || recipient.data.gameId === room.id)
            recipient.emit("room:player-joined", notice);
        }
      }
      return {
        id: player.id,
        token: player.token,
        name: player.name,
        avatar: player.avatar,
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
