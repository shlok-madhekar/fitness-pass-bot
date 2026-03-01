const puppeteer = require('puppeteer');

(async () => {
    let browser;
    try {
        browser = await puppeteer.launch({ headless: "new" });
        const page = await browser.newPage();

        console.log("Navigating...");
        await page.goto('https://www.24hourfitness.com/gyms/san-ramon-ca/san-ramon-super-sport#freepass', { waitUntil: 'networkidle2' });

        console.log("Typing into shadow DOM...");
        await page.type('>>> #fname', 'Test');
        await page.type('>>> #lname', 'User');
        await page.type('>>> #email', 'test.user.1235@gmail.com');
        await page.type('>>> #vemail', 'test.user.1235@gmail.com');
        await page.type('>>> #phone', '9251234568');
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

        console.log("Waiting 5s...");
        await new Promise(r => setTimeout(r, 5000));

        const bodyText = await page.evaluate(() => {
            function getShadowText(root) {
                let res = root instanceof Element ? (root.innerText || '') + ' ' : '';
                const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
                let node;
                while (node = walker.nextNode()) {
                    if (node.shadowRoot) res += getShadowText(node.shadowRoot) + ' ';
                }
                return res;
            }
            return getShadowText(document.body);
        });

        console.log("Extracted deep text snippet:", bodyText.substring(0, 1000));

        const codeMatch = bodyText.match(/Web Confirmation Code\s*([A-Z0-9]{6})/i);
        if (codeMatch) {
            console.log("Found code:", codeMatch[1]);
        } else {
            console.log("Code not found in deep text.");
        }

    } catch (e) {
        console.error(e);
        if (browser) await browser.close();
    }
    if (browser) await browser.close();
})();
