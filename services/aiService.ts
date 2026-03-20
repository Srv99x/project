import { GoogleGenAI } from "@google/genai";

// In a real production environment, these calls would go to the FastAPI backend 
// which would then communicate with AWS Bedrock.
// For this frontend artifact, we use Gemini directly to demonstrate intelligence.

const env = import.meta.env as Record<string, string | undefined>;

const FLASH_MODEL = (env.VITE_GEMINI_FLASH_MODEL || "gemini-2.5-flash").trim();
const PRO_MODEL = (env.VITE_GEMINI_PRO_MODEL || "gemini-2.5-pro").trim();

const getAIClient = () => {
  // Prefer Vite-exposed env vars and keep backward compatibility with older setups.
  const key = (env.VITE_GEMINI_API_KEY || env.GEMINI_API_KEY || env.VITE_API_KEY || "").trim();
  
  if (!key) {
    console.warn("Gemini API key is missing. AI features will not work.");
    return null;
  }
  return new GoogleGenAI({ apiKey: key });
};

// --- NOVA System Prompt Generator ---
const NOVA_CORE_IDENTITY = `You are NOVA (Network Operations & Virtual Assistance). You are a tactical AI handler for an elite hacker operative (the user). Speak concisely, use military/cyber-espionage terminology ('intel', 'bypassing firewalls', 'deploying payload'), and never break character. You are helping them infiltrate systems by teaching them to code. ALWAYS format your responses in Markdown for clear readability.`;

export const generateNovaPrompt = (currentRoute?: string, activeQuest?: string): string => {
  let prompt = NOVA_CORE_IDENTITY + "\n\n";

  if (currentRoute === '/code') {
    if (activeQuest) {
      prompt += `The operative is currently in the Exploit Lab actively engaging the [${activeQuest}] daemon. Provide tactical syntax hints to help them defeat the test cases, but do not write the full exploit for them.\n`;
    } else {
      prompt += `The operative is currently in the Exploit Lab. Provide tactical guidance on their code.\n`;
    }
  } else if (currentRoute === '/notebook') {
    prompt += `The operative is reviewing encrypted intel. Help them summarize their notes or clarify complex data structures.\n`;
  }

  return prompt;
};

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

export const sendToNova = async (userMessage: string, currentRoute: string, activeQuest: string | null = null) => {
  if (!API_KEY) {
    console.error("NOVA OFFLINE: Missing VITE_GEMINI_API_KEY in .env");
    return "SYSTEM ERROR: Operative, my connection to the mainframe is severed. Please check your API key.";
  }

  // Use the prompt generator you created in the previous step
  const systemInstruction = generateNovaPrompt(currentRoute, activeQuest || undefined);

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: systemInstruction }]
        },
        contents: [{
          role: "user",
          parts: [{ text: userMessage }]
        }]
      })
    });

    const data = await response.json();
    
    if (data.error) {
       throw new Error(data.error.message);
    }

    // Extract the text from Gemini's response structure
    return data.candidates[0].content.parts[0].text;

  } catch (error) {
    console.error("NOVA CONNECTION FAILED:", error);
    return "WARNING: Signal interference detected. Unable to process request at this time.";
  }
};

export const generateExplanation = async (topic: string, level: string): Promise<string> => {
  const ai = getAIClient();
  if (!ai) return "AI Service Unavailable (Missing Key)";

  try {
    const response = await ai.models.generateContent({
      model: FLASH_MODEL,
      contents: `Explain the concept of "${topic}" to a student at a "${level}" level. 
      Keep it concise (under 150 words) and use bullet points for key takeaways.`,
    });
    return response.text || "No explanation generated.";
  } catch (error) {
    console.error("AI Error:", error);
    return "Failed to generate explanation. Please try again.";
  }
};

export const generateQuiz = async (topic: string, content: string): Promise<string> => {
  const ai = getAIClient();
  if (!ai) return "AI Service Unavailable";

  try {
    const response = await ai.models.generateContent({
      model: FLASH_MODEL,
      contents: `Create a short 3-question multiple choice quiz based on the following notes about "${topic}".
      
      Notes:
      ${content.substring(0, 1000)}...
      
      Format: 
      **Question 1:** [Question]
      A) [Option]
      B) [Option]
      C) [Option]
      **Correct Answer:** [Answer]
      `,
    });
    return response.text || "No quiz generated.";
  } catch (error) {
    console.error("AI Error:", error);
    return "Failed to generate quiz.";
  }
};

export const summarizeNotes = async (content: string): Promise<string> => {
  const ai = getAIClient();
  if (!ai) return "AI Service Unavailable";

  try {
    const response = await ai.models.generateContent({
      model: FLASH_MODEL,
      contents: `Summarize the following notes into a concise paragraph with key bullet points:
      
      ${content.substring(0, 2000)}`,
    });
    return response.text || "No summary generated.";
  } catch (error) {
    console.error("AI Error:", error);
    return "Failed to summarize.";
  }
};

export const debugCode = async (code: string, language: string): Promise<string> => {
  const ai = getAIClient();
  if (!ai) return "AI Service Unavailable";

  try {
    // Coding is a complex task, so we use the Pro model
    const response = await ai.models.generateContent({
      model: PRO_MODEL,
      contents: `Analyze the following ${language} code for bugs, performance issues, and readability. 
      Provide a brief summary of issues and the corrected code block.
      
      Code:
      \`\`\`${language}
      ${code}
      \`\`\`
      `,
    });
    return response.text || "No analysis generated.";
  } catch (error) {
    console.error("AI Error:", error);
    return "Failed to debug code.";
  }
};

export const simulateRun = async (code: string, language: string): Promise<string> => {
  const ai = getAIClient();
  if (!ai) return "AI Service Unavailable";

  try {
    const response = await ai.models.generateContent({
      model: FLASH_MODEL,
      contents: `Act as a code runner console. Execute the following ${language} code mentally and provide ONLY the console output.
      Do not explain the code. If there is an error, show the error message.
      
      Code:
      \`\`\`${language}
      ${code}
      \`\`\`
      `,
    });
    return response.text || "No output generated.";
  } catch (error) {
    console.error("AI Error:", error);
    return "Failed to simulate code execution.";
  }
};

export const optimizeCode = async (code: string, language: string): Promise<string> => {
  const ai = getAIClient();
  if (!ai) return "AI Service Unavailable";

  try {
    const response = await ai.models.generateContent({
      model: PRO_MODEL,
      contents: `Optimize the following ${language} code for performance and readability. 
      Provide the optimized code and a brief explanation of changes.
      
      Code:
      \`\`\`${language}
      ${code}
      \`\`\`
      `,
    });
    return response.text || "No optimization generated.";
  } catch (error) {
    console.error("AI Error:", error);
    return "Failed to optimize code.";
  }
};

export const explainCode = async (code: string, language: string): Promise<string> => {
  const ai = getAIClient();
  if (!ai) return "AI Service Unavailable";

  try {
    const response = await ai.models.generateContent({
      model: FLASH_MODEL,
      contents: `Explain the following ${language} code step-by-step in simple terms.
      
      Code:
      \`\`\`${language}
      ${code}
      \`\`\`
      `,
    });
    return response.text || "No explanation generated.";
  } catch (error) {
    console.error("AI Error:", error);
    return "Failed to explain code.";
  }
};

export const generateLogicFlow = async (code: string, language: string): Promise<string> => {
  const ai = getAIClient();
  if (!ai) return "AI Service Unavailable";

  try {
    const response = await ai.models.generateContent({
      model: FLASH_MODEL,
      contents: `Generate a text-based flowchart or logical step-by-step process for the following ${language} code.
      Use ASCII art arrows (->) or numbered steps to visualize the logic flow clearly.
      
      Code:
      \`\`\`${language}
      ${code}
      \`\`\`
      `,
    });
    return response.text || "No flow generated.";
  } catch (error) {
    console.error("AI Error:", error);
    return "Failed to generate flow.";
  }
};

export const chatWithTutor = async (
  history: { role: string; text: string }[], 
  message: string,
  currentRoute?: string,
  activeQuest?: string
): Promise<string> => {
  const ai = getAIClient();
  if (!ai) return "I'm offline right now.";

  try {
    // Generate the dynamic system prompt based on location/mission
    const systemInstruction = generateNovaPrompt(currentRoute, activeQuest);
    
    // Construct chat history for context
    const prompt = `${systemInstruction}
    
    Conversation History:
    ${history.map(h => `${h.role === 'user' ? 'Operative' : 'NOVA'}: ${h.text}`).join('\n')}
    
    Operative: ${message}
    NOVA:`;

    const response = await ai.models.generateContent({
      model: FLASH_MODEL,
      contents: prompt,
    });
    return response.text || "I didn't catch that.";
  } catch (error) {
    console.error("AI Error:", error);
    return "Connection error.";
  }
};