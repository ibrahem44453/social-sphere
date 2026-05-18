import { Router } from "express";
import type { Request, Response } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.post("/sync-user", async (req: Request, res: Response) => {
  try {
    const body = req.body as {
      id?: string;
      email?: string;
      username?: string;
      display_name?: string;
    };

    const { id, email, username, display_name } = body;

    if (!id || !email) {
      return res.status(400).json({
        error: "id and email required",
      });
    }

    const uname =
      username ||
      email
        .split("@")[0]
        .replace(/[^a-z0-9_]/gi, "_")
        .toLowerCase();

    const dname = display_name || uname;

    const existing = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, id));

    if (existing.length === 0) {
      try {
        await db.insert(usersTable).values({
          id,
          username: uname,
          display_name: dname,
        });
      } catch {
        const uniqueUname = `${uname}_${id.slice(0, 6)}`;

        await db
          .insert(usersTable)
          .values({
            id,
            username: uniqueUname,
            display_name: dname,
          })
          .onConflictDoNothing();
      }
    }

    const user = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, id));

    return res.json(user[0] || null);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "internal server error",
    });
  }
});

export default router;