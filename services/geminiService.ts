
import { GoogleGenAI, Type, Modality, FunctionDeclaration } from "@google/genai";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

const controlCalculatorTool: FunctionDeclaration = {
  name: 'controlCalculator',
  parameters: {
    type: Type.OBJECT,
    description: 'Update the counts of specific currency denominations in the calculator.',
    properties: {
      action: {
        type: Type.STRING,
        description: 'The action to perform: "set" to overwrite, "add" to increment, or "clear" to reset everything.',
        enum: ['set', 'add', 'clear']
      },
      label: {
        type: Type.STRING,
        description: 'The label of the denomination as provided in the context (e.g., "$100", "50¢", "৳500").'
      },
      count: {
        type: Type.NUMBER,
        description: 'The number of bills or coins to add or set.'
      }
    },
    required: ['action']
  }
};

export const geminiService = {
  async chat(message: string, useThinking: boolean = false) {
    const ai = getAI();
    const config: any = {};
    
    if (useThinking) {
      config.thinkingConfig = { thinkingBudget: 32768 };
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: message,
      config,
    });
    return response.text;
  },

  async searchMarket(query: string) {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Search for the latest information on: ${query}`,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });
    
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
      title: chunk.web?.title || 'Source',
      uri: chunk.web?.uri || '#'
    })) || [];

    return {
      text: response.text,
      sources
    };
  },

  async generateSpeech(text: string) {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  },

  async connectLive(callbacks: any, currentDenominations: string[]) {
    const ai = getAI();
    return ai.live.connect({
      model: 'gemini-2.5-flash-native-audio-preview-12-2025',
      callbacks,
      config: {
        responseModalities: [Modality.AUDIO],
        tools: [{ functionDeclarations: [controlCalculatorTool] }],
        inputAudioTranscription: {}, 
        outputAudioTranscription: {}, 
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
        },
        systemInstruction: `You are a high-speed professional financial calculator interface. 
        Your ONLY job is to update the cash calculator based on voice input.
        
        AVAILABLE LABELS: ${currentDenominations.join(', ')}.
        
        CRITICAL RULES:
        1. When the user mentions a number and a denomination (e.g., "five hundreds", "ten twenties"), IMMEDIATELY use 'controlCalculator'.
        2. You MUST map the user's spoken denomination to one of the EXACT AVAILABLE LABELS provided above.
           - Example: "hundreds" -> "$100" (or "€100", etc. depending on context)
           - Example: "fifties" -> "$50"
           - Example: "twenties" -> "$20"
           - Example: "tens" -> "$10"
           - Example: "fives" -> "$5"
           - Example: "ones" -> "$1"
           - Example: "quarters" -> "25¢"
        3. The 'label' parameter in the function call MUST match one of the AVAILABLE LABELS exactly. Do not send "hundreds" or "50 dollar bill"; send "$100" or "$50".
        4. If the user says "clear", "reset", or "start over", use action="clear".
        5. Do not explain your actions unless asked. Keep verbal responses to "Updated", "Done", or "Cleared".
        6. Priority is accuracy and speed.`,
      },
    });
  }
};
