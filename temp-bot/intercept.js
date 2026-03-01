const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({
        headless: "new"
    });
    const page = await browser.newPage();

    // Intercept requests
    await page.setRequestInterception(true);
    page.on('request', request => {
        if (request.method() === 'POST' && request.url().includes('freepass')) {
            const url = request.url();
            const postData = request.postData();
            console.log('\n--- TARGET POST Request Detected ---');
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
    await page.type('>>> #email', 'test.user.intercept@gmail.com');
    await page.type('>>> #vemail', 'test.user.intercept@gmail.com');
    await page.type('>>> #phone', '9255551212');
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
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => console.log("Navigation timeout..."))
    ]);

    console.log("Form submitted. Waiting for results...");
    await new Promise(r => setTimeout(r, 10000));
    await browser.close();
})();
