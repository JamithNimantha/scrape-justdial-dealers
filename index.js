const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const ObjectToCsv = require("objects-to-csv");

const dto = {
    company: "Chaudhary Books Centre",
    telphone_1: "+(91)-9412330156",
    telphone_2: "+(91)-9412330156",
    address: "Ganesh Complex, Mau Road, Khandari, Agra - 282010",
    link: "https://www.justdial.com/Agra/Chaudhary-Books-Centre-NEAR-KALI-MANDIR-Sikandra/0562PX562-X562-180725132008-J1M8_BZDET?xid=QWdyYSBTY2hvb2wgQm9vayBEZWFsZXJz"
}

async function main() {

    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    await crawlPages(page);

    await browser.close();

}

async function writeToCsv(data){
    let csv = new ObjectToCsv(data);

    await csv.toDisk('./sample.csv');
}

async function crawlPages(page) {
    const infos = [];

    let pageCount = 1;

    // while (true) {
    await page.goto('https://www.justdial.com/Agra/School-Book-Dealers/nct-11422690/page-' + pageCount, {
        waitUntil: 'networkidle0'
    });

    links = await scrapeFullPage(page);
    const info = await scrapeInfo(links, page);
    // infos.push(info);
    // console.log(infos);
    await writeToCsv(info);
    
    // }
}

async function scrapeFullPage(page) {
    const links = [];
    const target = 100;
    try {
        let targetCount = 1;
        let preHeight;
        while (targetCount < target) {
            targetCount = await page.evaluate("document.getElementsByClassName('cntanr').length");
            preHeight = await page.evaluate("document.body.scrollHeight");
            await page.evaluate("window.scrollTo(0, document.body.scrollHeight)");
            // await page.waitForFunction(
            //     `document.body.scrollHeight > ${preHeight}`
            // );
            // console.log(await page.evaluate("window.getComputedStyle(document.querySelector('.icon-oqp'), ':before').getPropertyValue('content')"));
            await page.waitFor(500);
        }

    } catch (error) {
        console.log(error);
    }

    const html = await page.evaluate(() => document.body.innerHTML);
    const $ = await cheerio.load(html);
    $(".cntanr").each((index, element) => {
        const link = ($(element).attr('data-href'));
        const classNames = [];
        $(element).find('.mobilesv').each((index, el) => {
            const className = $(el).attr('class').split(/\s+/)[1];
            classNames.push(className);
        });
        const tel = getTelNumber(classNames);
        links.push({link,tel});
    });

    return links;
}

function getTelNumber(classNames) {
    const num = [];
    for (let name of classNames) {
        switch (name) {
            case 'icon-dc':
                num.push("+");
                break;
            case 'icon-fe':
                num.push("(");
                break;
            case 'icon-hg':
                num.push(")");
                break;
            case 'icon-ba':
                num.push("-");
                break;
            case 'icon-acb':
                num.push("0");
                break;
            case 'icon-yz':
                num.push("1");
                break;
            case 'icon-wx':
                num.push("2");
                break;
            case 'icon-vu':
                num.push("3");
                break;
            case 'icon-ts':
                num.push("4");
                break;
            case 'icon-rq':
                num.push("5");
                break;
            case 'icon-po':
                num.push("6");
                break;
            case 'icon-nm':
                num.push("7");
                break;
            case 'icon-lk':
                num.push("8");
                break;
            case 'icon-ji':
                num.push("9");
                break;
        }
    }
    return num.join('');
}

async function scrapeInfo(links, page) {
    const infos = [];
    for (i = 0; i < links.length; i++) {
        await page.goto(links[i].link, {
            waitUntil: 'networkidle0'
        });
        const html = await page.evaluate(() => document.body.innerHTML);
        const $ = await cheerio.load(html);
        const business = $('span.fn').text();
        const address = $('#fulladdress > span > span').text();
        const telephone = links[i].tel;
        const link = links[i].link;

        infos.push({ business, address, telephone, link });
        console.log(infos[i]);
    }
    return infos;
}

main();