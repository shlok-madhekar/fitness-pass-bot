import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { firstName, lastName, dateOfBirth, phoneNumber, gymUrl } = await req.json();

        if (!firstName || !lastName || !dateOfBirth || !gymUrl) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        console.log(`Generating pass for ${firstName} ${lastName} (${dateOfBirth}) at ${gymUrl}...`);

        // Dynamically resolve clubId from the gym URL
        let clubId = "00512"; // Default fallback
        try {
            console.log(`Resolving clubId from ${gymUrl}...`);
            const gymPageRes = await fetch(gymUrl, {
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }
            });
            const html = await gymPageRes.text();

            // Extract clubId from digitalData object in script tags
            const clubIdMatch = html.match(/"clubId"\s*:\s*"(\d+)"/i) || html.match(/clubId\s*:\s*'(\d+)'/i);

            if (clubIdMatch && clubIdMatch[1]) {
                clubId = clubIdMatch[1];
                console.log(`Resolved clubId: ${clubId}`);
            } else {
                console.warn("Could not find clubId in gym page, using fallback.");
            }
        } catch (e) {
            console.error("Error resolving clubId dynamically:", e);
        }

        // Preparation for 24 Hour Fitness API
        // Use provided phone number or fallback to random
        let finalPhone = "";
        let finalAreaCode = "925";

        if (phoneNumber && phoneNumber.length === 10) {
            finalAreaCode = phoneNumber.substring(0, 3);
            finalPhone = phoneNumber.substring(3);
        } else {
            // Random fallback if missing
            finalPhone = Math.floor(1000000 + Math.random() * 9000000).toString();
        }

        // Handle DOB safely. We want Midnight UTC for the given date.
        // dateOfBirth is YYYY-MM-DD
        const dateParts = dateOfBirth.split('-');
        const dobTimestamp = Date.UTC(
            parseInt(dateParts[0]),
            parseInt(dateParts[1]) - 1,
            parseInt(dateParts[2])
        );

        // Generate a unique email
        const randomString = Math.random().toString(36).substring(2, 8);
        const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${Date.now()}.${randomString}@gmail.com`;

        const payload = {
            clubId: clubId,
            passCode: "CLUBPASS",
            contactType: 6,
            agencyInfo: {
                employeeId: "100",
                sourceTypeId: 2093
            },
            personalInfo: {
                dateOfBirth: dobTimestamp,
                email: email,
                firstName: firstName,
                lastName: lastName,
                phone: finalPhone,
                areaCode: finalAreaCode
            },
            allowSms: true
        };

        console.log("Sending direct API request to 24 Hour Fitness...");

        const response = await fetch('https://api.24hourfitness.com/free-pass', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Origin': 'https://www.24hourfitness.com',
                'Referer': 'https://www.24hourfitness.com/gyms/san-ramon-ca/san-ramon-super-sport',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("API Error Response:", errorText);
            throw new Error(`24 Hour Fitness API returned ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        console.log("API Success Response:", data);

        // The clubPassId is the actual unique confirmation code (e.g. YHEJIW)
        // passCode is often just "CLUBPASS" (the type of pass)
        const code = data.clubPassId || data.passCode || data.confirmationCode || data.code;

        if (code) {
            console.log(`Successfully acquired code: ${code}`);
            return NextResponse.json({ success: true, code });
        } else {
            console.error("Could not find confirmation code in API response:", data);
            return NextResponse.json({ error: 'Failed to extract the entry code from the API response.' }, { status: 500 });
        }

    } catch (error: unknown) {
        console.error("Error generating pass:", error);
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal Server Error' }, { status: 500 });
    }
}
