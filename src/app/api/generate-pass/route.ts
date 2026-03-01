import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

export async function POST(req: Request) {
    try {
        const { firstName, lastName, dateOfBirth } = await req.json();

        if (!firstName || !lastName || !dateOfBirth) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        console.log(`Generating pass for ${firstName} ${lastName} (${dateOfBirth})...`);

        const isLocal = process.env.NODE_ENV === 'development';
        let browser;

        if (isLocal) {
            // Local fallback path for Mac. For other OS, this path would need to be updated.
            const localExecutablePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
            console.log(`Running locally. Using local Chrome at: ${localExecutablePath}`);
            browser = await puppeteer.launch({
                args: ['--no-sandbox', '--disable-setuid-sandbox'],
                defaultViewport: { width: 1920, height: 1080 },
                executablePath: localExecutablePath,
                headless: true,
            });
        } else {
            console.log('Running in production. Using @sparticuz/chromium');
            browser = await puppeteer.launch({
                args: chromium.args,
                defaultViewport: { width: 1920, height: 1080 },
                executablePath: await chromium.executablePath(),
                headless: true,
            });
        }

        const page = await browser.newPage();

        // Set a realistic user agent
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        try {
            console.log("Navigating to 24 Hour Fitness Free Pass page...");
            await page.goto('https://www.24hourfitness.com/gyms/san-ramon-ca/san-ramon-super-sport#freepass', {
                waitUntil: 'networkidle2',
                timeout: 30000
            });

            console.log("Filling out form...");
            await page.type('>>> #fname', firstName);
            await page.type('>>> #lname', lastName);

            // Generate realistic-looking distinct email
            const randomString = Math.random().toString(36).substring(2, 8);
            const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${Date.now()}.${randomString}@gmail.com`;
            await page.type('>>> #email', email);
            await page.type('>>> #vemail', email);

            // Generate random valid-looking local phone
            const phone = `925${Math.floor(1000000 + Math.random() * 9000000)}`;
            await page.type('>>> #phone', phone);

            // Format should be mm/dd/yyyy based on the HTML input type="date"
            await page.type('>>> #date', dateOfBirth);

            // Consent checkbox
            await page.click('>>> #sms-checkbox');

            console.log("Submitting form...");
            await Promise.all([
                page.evaluate(() => {
                    const getShadowButtons = (root: Node) => {
                        let res: HTMLElement[] = [];
                        const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
                        let node;
                        while (node = walker.nextNode()) {
                            if ((node as HTMLElement).shadowRoot) res = res.concat(getShadowButtons((node as HTMLElement).shadowRoot as unknown as Node));
                            if ((node as HTMLElement).tagName.toLowerCase() === 'button') res.push(node as HTMLElement);
                        }
                        return res;
                    };
                    const buttons = getShadowButtons(document.body);
                    const submitBtn = buttons.find(b => b.innerText.toUpperCase().includes('PASS'));
                    if (submitBtn) submitBtn.click();
                }),
                page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => console.log("Navigation timeout or dynamic update. Continuing..."))
            ]);

            // Wait a bit for potential JS updates after navigation
            await new Promise(r => setTimeout(r, 5000));

            const bodyText = await page.evaluate(() => {
                function getShadowText(root: Node): string {
                    let res = root instanceof HTMLElement ? ((root as HTMLElement).innerText || '') + ' ' : '';
                    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
                    let node;
                    while (node = walker.nextNode()) {
                        if ((node as HTMLElement).shadowRoot) res += getShadowText((node as HTMLElement).shadowRoot as unknown as Node) + ' ';
                    }
                    return res;
                }
                return getShadowText(document.body);
            });

            // The pass code is a 6-character alphanumeric code
            const codeMatch = bodyText.match(/Web Confirmation Code\s*([A-Z0-9]{6})/i);

            await browser.close();

            if (codeMatch && codeMatch[1]) {
                const code = codeMatch[1];
                console.log(`Successfully extracted code: ${code}`);
                return NextResponse.json({ success: true, code });
            } else {
                console.error("Could not find the confirmation code in the response body.");
                return NextResponse.json({ error: 'Failed to extract the entry code from the success page.' }, { status: 500 });
            }

        } catch (error) {
            await browser.close();
            throw error;
        }

    } catch (error: unknown) {
        console.error("Error generating pass:", error);
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal Server Error' }, { status: 500 });
    }
}
