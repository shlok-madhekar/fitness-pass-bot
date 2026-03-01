const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();

    console.log("Navigating...");
    await page.goto('https://www.24hourfitness.com/gyms/san-ramon-ca/san-ramon-super-sport#freepass', { waitUntil: 'networkidle2' });

    console.log("Analyzing buttons...");
    const buttons = await page.evaluate(() => {
        function getShadowButtons(root) {
            let res = [];
            const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
            let node;
            while (node = walker.nextNode()) {
                if (node.shadowRoot) {
                    res = res.concat(getShadowButtons(node.shadowRoot));
                }
                if (node.tagName.toLowerCase() === 'button') {
                    res.push({
                        tag: 'shadow-button',
                        id: node.id,
                        name: node.name,
                        type: node.type,
                        text: node.innerText
                    });
                }
            }
            return res;
        }
        return getShadowButtons(document.body);
    });

    console.log(JSON.stringify(buttons, null, 2));
    await browser.close();
})();
