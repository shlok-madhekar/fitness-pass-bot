import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { firstName, lastName, dateOfBirth } = await req.json();

        if (!firstName || !lastName || !dateOfBirth) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        console.log(`Generating pass for ${firstName} ${lastName} (${dateOfBirth})...`);

        // Prepare data for the 24 Hour Fitness API
        // DOB comes as yyyy-mm-dd from the input. Convert to timestamp.
        const dobTimestamp = new Date(dateOfBirth).getTime();

        // Generate a random local phone number
        const areaCode = "925"; // San Ramon area code
        const localPhone = Math.floor(1000000 + Math.random() * 9000000).toString();

        // Generate a unique email
        const randomString = Math.random().toString(36).substring(2, 8);
        const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${Date.now()}.${randomString}@gmail.com`;

        const payload = {
            clubId: "00512", // San Ramon Super-Sport
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
                phone: localPhone,
                areaCode: areaCode
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

        // Based on typical API structures, the pass code is usually in the result
        // If data.passCode exists, use it. Otherwise, look for where it might be.
        // The subagent results said it returns a confirmation code.
        const code = data.passCode || data.confirmationCode || data.code;

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
