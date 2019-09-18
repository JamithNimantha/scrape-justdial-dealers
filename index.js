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

async function writeToCsv(data) {
    let csv = new ObjectToCsv(data);
    await csv.toDisk('./sample.csv', { append: true });
    console.log("DATA WRITTEN TO CSV !");
}

async function crawlPages(page) {
    const infos = [];

    // let pageCount = 1;

    for (let pageCount = 1;pageCount>0;pageCount++) {
        console.log("SCRAPING PAGE " + pageCount);
        // const page = await browser.newPage();

        /* 
        // to disable the redirect of the response
        await page.setRequestInterception(true);
        page.on('request', request => {
            if (request.isNavigationRequest() && request.redirectChain().length !== 0) {
                request.abort();
            } else {
                request.continue();
            }
        }); 
        */

        // await page.waitFor(3000);
        // setTimeout(() => {
        // }, 3000)
        const url = 'https://www.justdial.com/Virudhunagar/School-Book-Dealers/nct-11422690/page-'+pageCount;
        url.trim();
        // await page.setDefaultTimeout(60000); 
        await page.setJavaScriptEnabled(false); // this will disable javascript so the status code 301 will not be redirected
        await page.goto(url,{waitUntil: 'networkidle0'});
        console.log(page.url()); // prints the current web page url
        const length = await page.evaluate("document.getElementsByClassName('cntanr').length"); // find there is any element to scrape
        if (length == 0) {
            console.log("NO MORE PAGES TO SCRAPE !!!");
            // page.close();
            break;
        }
        const title = await page.evaluate("document.getElementsByTagName('title')[0].text"); // get page title
        const target = parseInt(title.replace(/[^0-9\.]/g, ''), 10);  // get the target 
        links = await scrapeFullPage(page, target);
        const info = await scrapeInfo(links, page);
        // infos.push(info);
        // console.log(infos);
        await writeToCsv(info);
    }
}

async function scrapeFullPage(page, target) {
    await page.setJavaScriptEnabled(true);
    await page.reload();
    const links = [];
    // const target = 10;
    console.log("THIS PAGE HAS " + target + " TARGET LISTS");
    try {
        let targetCount = 1;
        let preHeight;
        while (targetCount < 20) {
            targetCount = await page.evaluate("document.getElementsByClassName('cntanr').length");
            preHeight = await page.evaluate("document.body.scrollHeight");
            await page.evaluate("window.scrollTo(0, document.body.scrollHeight)");
            await page.waitForFunction(
                `document.body.scrollHeight > ${preHeight}`
            );
            // console.log(await page.evaluate("window.getComputedStyle(document.querySelector('.icon-oqp'), ':before').getPropertyValue('content')"));
            await page.waitFor(500);
        }

    } catch (error) {
        console.log("SCROLLING TIMEOUT !!");
    }

    const html = await page.evaluate(() => document.body.innerHTML);
    const $ = await cheerio.load(html);  // load the html into cheerio
    $(".cntanr").each((index, element) => {
        const link = ($(element).attr('data-href')); // get the link of the dealer shop
        const classNames = [];
        $(element).find('.mobilesv').each((index, el) => {
            const className = $(el).attr('class').split(/\s+/)[1]; // returns all the classnames as list
            classNames.push(className);
        });
        const tel = getTelNumber(classNames);
        // console.log({link,tel});
        links.push({ link, tel });
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
        await page.goto(links[i].link, {waitUntil: 'networkidle0'});
        const html = await page.evaluate(() => document.body.innerHTML);
        const $ = await cheerio.load(html);
        const business = $('span.fn').text(); // extract business name
        const address = $('#fulladdress > span > span').text(); // extract address
        const telephone = links[i].tel; //extract telephone
        const link = links[i].link;

        infos.push({ business, address, telephone, link });
        
        // console.log(infos[i]);
    }
    return infos;
}

main();