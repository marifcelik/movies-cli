import { Confirm, Input, Select, prompt } from "https://deno.land/x/cliffy/prompt/mod.ts"
import { colors } from "https://deno.land/x/cliffy/ansi/colors.ts"
import DB, { type Movie } from "./db.ts";

export abstract class Command {
    constructor(protected db: DB) { }

    abstract execute(): unknown;
}

type DBListMethods = Extract<keyof DB, 'getAllMovies' | 'getWatchedMovies' | 'getUnwatchedMovies'>

abstract class ListCommand extends Command {
    constructor(protected db: DB, private listMethod: DBListMethods, private message: string, private wathced?: boolean) {
        super(db)
    }

    async execute() {
        const list = this.db[this.listMethod]()
        const selected = await listMovies(list, this.message)
        printMovie(selected, this.wathced)
        await movieOptions(selected.id!, this.db)
    }
}

abstract class CUDCommand extends Command {
    constructor(protected db: DB, public id: string | number) {
        super(db)
    }
}

class Commands {
    AllMovies = class extends ListCommand {
        constructor(db: DB) {
            super(db, 'getAllMovies', 'tüm filmler')
        }
    }

    WatchedMovies = class extends ListCommand {
        constructor(db: DB) {
            super(db, 'getWatchedMovies', 'izlenilen filmler', true)
        }
    }

    UnwatchedMovies = class extends ListCommand {
        constructor(db: DB) {
            super(db, 'getUnwatchedMovies', 'izlenilmeyen filmler')
        }
    }

    AddMovie = class extends CUDCommand {
        async execute() {
            const movie = await prompt([
                {
                    name: 'name',
                    message: 'film adı',
                    type: Input,
                    validate: p => p.trim().length < 3 ? 'en az 3 karakter' : true
                },
                {
                    name: 'watched',
                    message: 'izledin mi?',
                    type: Confirm
                }
            ])

            const id = this.db.addMovie(movie as Required<typeof movie>)
            printMovie({ id, ...movie })
        }
    }

    MarkAsWatched = class extends CUDCommand {
        async execute() {
            this.db.markAsWatched(this.id)
            console.log(colors.brightGreen.bold('🗸'), 'izlendi olarak işaretlendi')
        }
    }

    MarkAsUnwatched = class extends CUDCommand {
        async execute() {
            this.db.markAsUnwatched(this.id)
            console.log(colors.brightRed('✗'), 'izlenmedi olarak işaretlendi')
        }
    }

    UpdateMovie = class extends CUDCommand {
        async execute() {
            const updated = await prompt([
                {
                    name: 'name',
                    message: 'yeni adı',
                    type: Input,
                    validate: p => p.trim().length < 3 ? 'en az 3 karakter' : true
                },
                {
                    name: 'watched',
                    message: 'izledin mi?',
                    type: Confirm
                }
            ])

            this.db.changeName({ id: this.id, ...updated as Required<typeof updated> })
            console.log(colors.brightGreen.bold('🗸'), 'başarılı')
            printMovie({ id: this.id as number, ...updated })
        }
    }

    DeleteMovie = class extends CUDCommand {
        async execute() {
            const result = await Confirm.prompt({
                message: 'emin misin?',
                default: false
            })

            if (result) {
                this.db.deleteMovie(this.id)
                console.log(colors.brightGreen.bold('🗸'), 'silindi')
            }
        }
    }
}

const commands = new Commands()

async function listMovies(l: Partial<Movie>[], msg: string) {
    const selected = await Select.prompt({
        message: msg,
        hint: '⭾ tab tuşu ile seçim yap',
        search: true,
        options: l.map(v => v.name!)
    })

    return l.find(v => v.name!.trim() === selected.trim())!
}

async function printMovie(m: Partial<Movie>, watched?: boolean) {
    console.log(
        colors.bgBrightMagenta(' ' + m.id!.toString()! + ' '),
        '',
        colors.brightCyan.underline(m.name!),
        '',
        watched ? colors.brightGreen.bold('🗸') : colors.brightRed('✗'),
        colors.gray(m.createdAt ? new Date(m.createdAt).toLocaleDateString()! : '-'),
        colors.gray(m.updatedAt ? new Date(m.updatedAt).toLocaleDateString()! : '-')
    )
}

async function movieOptions(id: number, db: DB) {
    const result = await Select.prompt({
        message: 'ne yapmak istersin?',
        options: [
            { name: colors.brightGreen.bold('🗸') + ' izlendi olarak işaretle', value: commands.MarkAsWatched },
            { name: colors.brightRed('✗') + ' izlenmedi olarak işaretle', value: commands.MarkAsUnwatched },
            { name: '✏️  düzenle', value: commands.UpdateMovie },
            { name: '🗑️  sil', value: commands.DeleteMovie },
            Select.separator(),
            { name: '🔴 iptal', value: null }
        ]
    })

    if (!result)
        return

    await new result(db, id).execute()
}

export default commands
