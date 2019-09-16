const puppeteer = require('puppeteer');
const cheerio = require('cheerio');

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

    // await browser.close();

}

async function crawlPages(page) {
    const infos = [];

    let pageCount = 1;

    // while (true) {
    await page.goto('https://www.justdial.com/Agra/School-Book-Dealers/nct-11422690/page-' + pageCount, {
        waitUntil: 'networkidle0'
    });

    links = await scrapeFullPage(page);
    console.log(links);
    const info = await scrapeInfo(links, page);
    infos.push(info);

    console.log(infos);
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
        links.push(link);

    });
    return links;
}

async function scrapeInfo(links , page) {
    const infos = [];
    for(i = 0; i < links.length ; i++){
        await page.goto(links[i],{
            waitUntil: 'networkidle0'
        });
        const html = await page.evaluate(() => document.body.innerHTML);
        const $ = await cheerio.load(html);
        const business = $('span.fn').text();
        console.log(business);
        let address;
        try{
        address = $('span.lng_add').text();
        }catch(error){
            address = $('span.lng_add').text();
        }
        const telphone_1 = '';
        const telphone_2 = '';

        infos.push({business,address,telphone_1, telphone_2});
    }
    return infos;
}

main();