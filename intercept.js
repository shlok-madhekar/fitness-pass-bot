const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');

(async () => {
    // Local path, modify if necessary
    const localExecutablePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
    const browser = await puppeteer.launch({
        executablePath: localExecutablePath,
        headless: "new"
    });
    const page = await browser.newPage();

    // Intercept requests
    await page.setRequestInterception(true);
    page.on('request', request => {
        if (request.method() === 'POST') {
            const url = request.url();
            const postData = request.postData();
            console.log('\n--- POST Request Detected ---');
            console.log('URL:', url);
            console.log('Headers:', JSON.stringify(request.headers(), null, 2));
            console.log('PostData:', postData);
            console.log('-----------------------------\n');
        }
        request.continue();
    });

    console.log("Navigating...");
    await page.goto('https://www.24hourfitness.com/gyms/san-ramon-ca/san-ramon-super-sport#freepass', { waitUntil: 'networkidle2' });

    console.log("Typing into shadow DOM...");
    await page.type('>>> #fname', 'Test');
    await page.type('>>> #lname', 'User');
    await page.type('>>> #email', 'test.user.12351@gmail.com');
    await page.type('>>> #vemail', 'test.user.12351@gmail.com');
    await page.type('>>> #phone', '9251234569');
    await page.type('>>> #date', '2000-01-01');
    await page.click('>>> #sms-checkbox');

    console.log("Clicking submit...");
    await Promise.all([
        page.evaluate(() => {
            const getShadowButtons = (root) => {
                let res = [];
                const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
                let node;
                while (node = walker.nextNode()) {
                    if (node.shadowRoot) res = res.concat(getShadowButtons(node.shadowRoot));
                    if (node.tagName.toLowerCase() === 'button') res.push(node);
                }
                return res;
            };
            const buttons = getShadowButtons(document.body);
            const submitBtn = buttons.find(b => b.innerText.toUpperCase().includes('PASS'));
            if (submitBtn) submitBtn.click();
        }),
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => console.log("Navigation timeout..."))
    ]);

    await new Promise(r => setTimeout(r, 5000));
    await browser.close();
})();
