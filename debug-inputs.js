const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();

    console.log("Navigating...");
    await page.goto('https://www.24hourfitness.com/gyms/san-ramon-ca/san-ramon-super-sport#freepass', { waitUntil: 'networkidle2' });

    console.log("Analyzing inputs...");
    const inputs = await page.evaluate(() => {
        // Search main document
        const mainInputs = Array.from(document.querySelectorAll('input')).map(i => ({
            tag: 'input',
            id: i.id,
            name: i.name,
            type: i.type,
            placeholder: i.placeholder,
            ariaLabel: i.getAttribute('aria-label')
        }));

        // Search iframes (same origin)
        const iframes = Array.from(document.querySelectorAll('iframe'));
        let frameInputs = [];
        for (let iframe of iframes) {
            try {
                if (iframe.contentDocument) {
                    const iInputs = Array.from(iframe.contentDocument.querySelectorAll('input')).map(i => ({
                        tag: 'iframe-input',
                        id: i.id,
                        name: i.name,
                        type: i.type,
                        placeholder: i.placeholder,
                        ariaLabel: i.getAttribute('aria-label')
                    }));
                    frameInputs = frameInputs.concat(iInputs);
                }
            } catch (e) {
                // Cross origin
            }
        }

        // Search custom elements (Shadow DOM)
        // This is a simplistic deep query selector for shadow roots
        function getShadowInputs(root) {
            let res = [];
            const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
            let node;
            while (node = walker.nextNode()) {
                if (node.shadowRoot) {
                    res = res.concat(getShadowInputs(node.shadowRoot));
                }
                if (node.tagName.toLowerCase() === 'input') {
                    res.push({
                        tag: 'shadow-input',
                        id: node.id,
                        name: node.name,
                        type: node.type,
                        placeholder: node.placeholder,
                        ariaLabel: node.getAttribute('aria-label')
                    });
                }
            }
            return res;
        }

        const shadowInputs = getShadowInputs(document.body);

        return [...mainInputs, ...frameInputs, ...shadowInputs];
    });

    console.log(JSON.stringify(inputs, null, 2));

    await browser.close();
})();
