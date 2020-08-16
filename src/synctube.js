const puppeteer = require('puppeteer');

const base_url_synctube = 'https://sync-tube.de/create';

async function changeSettings(page){
    await page.waitForSelector('li > span');
    await page.click('#btnSettings');

    console.log("[changeSettings] Clicando nos botões");

    await page.click("tr[pid='rem'] td div[id='0']");
    await page.click("tr[pid='move'] td div[id='0']");
    await page.click("tr[pid='play'] td div[id='0']");
    await page.click("tr[pid='seek'] td div[id='0']");
    await page.click("tr[pid='skip'] td div[id='0']");
    await page.click("tr[pid='kick'] td div[id='0']");

    await page.click(".btnClose");
    console.log("[changeSettings] Fechou o Settings");
}

async function searchVideo(page, url){
    console.log('[searchVideo] Procurando video');

    await page.focus('.searchInput');
    await page.keyboard.type(url);
    await page.keyboard.press('Enter');

    console.log('[searchVideo] Clicou');
}

exports.synctube = async function (url_youtube){
    const browser = await puppeteer.launch({headless: true, defaultViewport: {width:1000, height:1000}, args: ['--no-sandbox', '--disable-setuid-sandbox']});
    // const browser = await puppeteer.launch({ headless: false, executablePath: 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'}); //For debugging
    const page = await browser.newPage();
    await page.goto(base_url_synctube);
    
    await changeSettings(page);
    await searchVideo(page, url_youtube);
    
    const url_page = page.url();
    await browser.close();
    
    return url_page;
}
