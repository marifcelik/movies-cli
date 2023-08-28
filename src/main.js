import { Select } from "https://deno.land/x/cliffy/prompt/mod.ts"
import { colors } from "https://deno.land/x/cliffy/ansi/colors.ts"
import DB from './db.ts'
import commands from './commands.ts'

const db = new DB()

console.log(colors.bgMagenta.bold(' 🎬 film listesi '))
console.log();

while (true) {
    const result = await Select.prompt({
        message: colors.bgCyan(' 📋 işlem '),
        groupIcon: colors.bold('↪ '),
        groupOpenIcon: '⤴',
        options: [
            {
                name: 'listeye bi göz at', options: [
                    { name: 'tümü', value: commands.AllMovies },
                    { name: 'izlediklerim', value: commands.WatchedMovies },
                    { name: 'izlemediklerim', value: commands.UnwatchedMovies }
                ]
            },
            { name: 'yeni film ekleyecem', value: commands.AddMovie },
            Select.separator(),
            { name: "console' u temizle", value: 'clear' },
        ]
    })

    if (result === 'clear') {
        console.clear()
        continue
    }

    await new result(db).execute()
}
