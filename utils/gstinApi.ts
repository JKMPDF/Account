import { GoogleGenAI } from "@google/genai";

interface GstinDetails {
    gstin: string;
    legalName: string;
    tradeName: string;
    address: string;
    state: string;
    pincode: string;
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Parses the key-value formatted text from the Gemini API response.
 * @param text The response text from the model.
 * @returns An object with the parsed details.
 */
const parseGstDetails = (text: string): Partial<GstinDetails> => {
    const details: Partial<GstinDetails> = {};
    const lines = text.split('\n');
    for (const line of lines) {
        const parts = line.split(':');
        if (parts.length > 1) {
            const key = parts[0].trim();
            const value = parts.slice(1).join(':').trim();

            if (value.toLowerCase() !== 'not found') {
                switch (key) {
                    case 'LEGAL_NAME':
                        details.legalName = value;
                        break;
                    case 'TRADE_NAME':
                        details.tradeName = value;
                        break;
                    case 'ADDRESS':
                        details.address = value;
                        break;
                    case 'STATE':
                        details.state = value;
                        break;
                    case 'PINCODE':
                        details.pincode = value;
                        break;
                }
            }
        }
    }
    return details;
};


/**
 * Fetches real, publicly available details for a given GSTIN using Google Search grounding.
 * It instructs the model to return data in a predictable key-value format for reliable parsing.
 * @param gstin The 15-digit Goods and Services Tax Identification Number.
 * @returns A promise that resolves with the authentic details if found, or null otherwise.
 */
export const fetchGstinDetails = async (gstin: string): Promise<GstinDetails | null> => {
    console.log(`Verifying GSTIN via AI Search and text parsing: ${gstin}`);

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Use Google Search to find the public details for the Indian GSTIN: "${gstin}". Extract the "Legal Name of Business", "Trade Name", "Principal Place of Business Address", "State", and "Pincode".
            
            Return the result ONLY in the following key-value format, with each key-value pair on a new line:
            LEGAL_NAME: [value]
            TRADE_NAME: [value]
            ADDRESS: [value]
            STATE: [value]
            PINCODE: [value]

            If you cannot find a specific piece of information, use the value "Not Found". Do not add any other text, explanations, or formatting.`,
            config: {
                tools: [{ googleSearch: {} }],
            },
        });

        const responseText = response.text.trim();
        console.log("Received raw text from API:", responseText);
        
        // Clean up potential markdown code fences from the response
        let cleanedText = responseText;
        if (cleanedText.startsWith('```') && cleanedText.endsWith('```')) {
            cleanedText = cleanedText.substring(3, cleanedText.length - 3).trim();
            // Handle optional language identifiers like ```text or ```json
            const firstLineBreak = cleanedText.indexOf('\n');
            if (firstLineBreak !== -1) {
                const firstLine = cleanedText.substring(0, firstLineBreak).trim();
                // A simple check if the first line is just a language identifier
                if (/^[a-z]+$/.test(firstLine)) {
                    cleanedText = cleanedText.substring(firstLineBreak + 1).trim();
                }
            }
        }
        
        const parsedData = parseGstDetails(cleanedText);

        if (parsedData.legalName && parsedData.address && parsedData.state && parsedData.pincode) {
            const details: GstinDetails = {
                gstin,
                legalName: parsedData.legalName,
                tradeName: parsedData.tradeName || parsedData.legalName,
                address: parsedData.address,
                state: parsedData.state,
                pincode: parsedData.pincode,
            };
            console.log("Successfully parsed GSTIN details:", details);
            return details;
        } else {
            console.error("Could not parse required fields from the model's response.", parsedData);
            return null;
        }

    } catch (error) {
        console.error("Error fetching or parsing GSTIN details from Gemini API:", error);
        return null;
    }
};
