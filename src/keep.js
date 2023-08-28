import { addExtra } from 'npm:puppeteer-extra'
import puppeteer_vanilla from 'npm:puppeteer@21.0.2'
import SleatehPlugin from 'npm:puppeteer-extra-plugin-stealth'
import { delay } from "https://deno.land/std@0.200.0/async/mod.ts";
import { exists } from "https://deno.land/std@0.200.0/fs/mod.ts";
import "https://deno.land/std@0.200.0/dotenv/load.ts";

/** @type {import("npm:puppeteer")} */
const puppeteer = addExtra(puppeteer_vanilla)
puppeteer.use(SleatehPlugin())

const browser = await puppeteer.launch({ headless: 'new', defaultViewport: null, args: ['--no-sandbox'], userDataDir: './data' })
const page = await browser.newPage()

async function main() {
    page.goto('https://keep.google.com')

    if (!await exists('./data', { isDirectory: true })) {
        await doIt(Deno.env.get('GOOGLE_USERNAME'), 'input#identifierId')
        await delay(2000)
        await doIt(Deno.env.get('GOOGLE_PASSWORD'), 'input[type="password"]')
        await delay(3000)
    }

    await doIt(null, '.notes-container div.ogm-kpc > div:nth-last-child(2) > div div:nth-child(1)')
    delay(1000)

    const movies = await page.$$eval('.notranslate[spellcheck="true"][dir="ltr"] + div div .CmABtb.RNfche', arr => {
        arr.shift()
        const arr2 = arr.splice(arr.findIndex(v => v.getAttribute("role")))
        arr2.shift()
        return [arr, arr2].map(t => t.map(v => v.firstChild.lastChild.childNodes[1].textContent))
    })

    movies[0].forEach(movie => db.addMovie(movie))
    movies[1].forEach(movie => db.addMovie(movie, true))
    console.log('Filmler eklendi')

    await browser.close()
    Deno.exit(0)
}

/**
 * @param {string} text
 * @param {string} selector
 * @param {boolean} click
 */
async function doIt(text, selector, click = true) {
    const el = await page.waitForSelector(selector, { visible: true });

    if (click) {
        await el.click();
        await delay(800);
    }
    if (text) {
        // console.log(text, 'yazılıyor')
        await page.keyboard.type(text);
        await delay(800);
        await page.keyboard.press('Enter');
    }

    return delay(800);
}

main()