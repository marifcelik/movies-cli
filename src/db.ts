import { Database } from "https://deno.land/x/sqlite3@0.9.1/mod.ts"
import "https://deno.land/std@0.200.0/dotenv/load.ts"

type DateableString = `${number}-${number}-${number} ${number}:${number}:${number}`

export type Movie = {
    id: number
    name: string
    watched: boolean
    createdAt: DateableString
    updatedAt: DateableString
}

export default class DB {
    private db;

    constructor(connectionString = Deno.env.get("DATABASE_PATH")) {
        if (!connectionString)
            connectionString = './movies.db'

        this.db = new Database(connectionString)

        this.db.exec(/* sql */`
            CREATE TABLE IF NOT EXISTS Movie (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              name TEXT,
              watched BOOLEAN DEFAULT 0,
              createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
              updatedAt DATETIME
            );
        `)
    }

    getAllMovies(): Movie[] {
        return this.db.prepare(/* sql */`
            SELECT * FROM Movie
        `).all();
    }

    getWatchedMovies(): Pick<Movie, 'id' | 'name'>[] {
        return this.db.prepare(/* sql */`
            SELECT id, name FROM Movie WHERE watched = 1
        `).all()
    }

    getUnwatchedMovies(): Pick<Movie, 'id' | 'name'>[] {
        return this.db.prepare(/* sql */`
            SELECT id, name FROM Movie WHERE watched = 0
        `).all()
    }

    addMovie({ name, watched = false }: { name: string, watched?: boolean }) {
        this.db.prepare(/* sql */`
            INSERT INTO Movie (name, watched, updatedAt) VALUES (?, ?, CURRENT_TIMESTAMP)
        `).run(name, watched)
        return this.db.lastInsertRowId
    }

    markAsWatched(id: string | number ) {
        return this.db.prepare(/* sql */`
            UPDATE Movie SET watched = 1, updatedAt = CURRENT_TIMESTAMP WHERE id = ?
        `).run(id)
    }

    markAsUnwatched(id: string | number) {
        return this.db.prepare(/* sql */`
            UPDATE Movie SET watched = 0, updatedAt = CURRENT_TIMESTAMP WHERE id = ?
        `).run(id)
    }

    changeName({ id, name }: { id: string | number, name: string }) {
        return this.db.prepare(/* sql */`
            UPDATE Movie SET name = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?
        `).run(name, id)
    }

    deleteMovie(id: string | number) {
        return this.db.prepare(/* sql */`
            DELETE FROM Movie WHERE id = ?
        `).run(id)
    }
}
