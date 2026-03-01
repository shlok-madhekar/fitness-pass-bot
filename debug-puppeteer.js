const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();

    console.log("Navigating...");
    await page.goto('https://www.24hourfitness.com/gyms/san-ramon-ca/san-ramon-super-sport#freepass', { waitUntil: 'networkidle2' });

    console.log("Waiting for selector...");
    try {
        await page.waitForSelector('#firstName', { timeout: 10000 });
        console.log("Selector found!");
    } catch (e) {
        console.log("Failed to find #firstName. Let's dump the frame tree or check if the form is rendering.");
        await page.screenshot({ path: '/tmp/debug1.png', fullPage: true });

        const html = await page.content();
        const fs = require('fs');
        fs.writeFileSync('/tmp/page-content.html', html);
        console.log("Saved page content to /tmp/page-content.html");
    }

    await browser.close();
})();
