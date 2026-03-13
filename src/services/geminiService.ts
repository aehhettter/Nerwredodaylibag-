import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

function bufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}

export async function generateMidiFromAudio(audioFile: File, params: {
    frequency: number;
    length: number;
    intensity: number;
    processingDepth: number;
    inversionAlgorithm: string;
    noiseReduction: boolean;
}): Promise<string> {
    const model = 'gemini-3-flash-preview';

    const audioBuffer = await audioFile.arrayBuffer();
    const base64Audio = bufferToBase64(audioBuffer);

    const prompt = `Analysiere die folgende Audiodatei und wandle sie in eine MIDI-Sequenz um. Berücksichtige die folgenden Parameter:
    - Frequenz (Hz): ${params.frequency}
    - Länge (ms): ${params.length}
    - Intensität (Ohm/V): ${params.intensity}
    - Verarbeitungstiefe (1-10): ${params.processingDepth} (Ein höherer Wert bedeutet eine detailliertere Analyse)
    - Invertierungs-Algorithmus: ${params.inversionAlgorithm} (Wende diesen Algorithmus an, um die musikalischen Eigenschaften zu invertieren)
    - Rauschunterdrückung: ${params.noiseReduction ? 'Aktiviert' : 'Deaktiviert'} (Führe eine Rauschunterdrückung durch, bevor du die Analyse startest)
    
    Erzeuge eine kreative, musikalische Interpretation der Audiodatei, die als "Voicecode" bezeichnet wird. Invertiere dann die musikalischen Eigenschaften (z.B. Melodie, Rhythmus) gemäß dem gewählten Algorithmus und stelle das Endergebnis als eine Liste von MIDI-Noten im JSON-Format dar. Jede Note sollte 'note', 'velocity', 'start' und 'duration' enthalten. Gib nur den JSON-Code aus.`;

    const contents = {
        parts: [
            { text: prompt },
            {
                inlineData: {
                    mimeType: audioFile.type,
                    data: base64Audio
                }
            }
        ]
    };

    try {
        const result = await ai.models.generateContent({ model, contents });
        const text = result.text.trim();
        // Clean up potential markdown code block fences
        return text.replace(/```json\n|```/g, '');
    } catch (error) {
        console.error("Error generating MIDI from audio:", error);
        throw new Error("Die MIDI-Generierung ist fehlgeschlagen.");
    }
}

export async function analyzeAudioSafety(audioFile: File): Promise<string> {
    const model = 'gemini-3-flash-preview';

    const audioBuffer = await audioFile.arrayBuffer();
    const base64Audio = bufferToBase64(audioBuffer);

    const prompt = `Führe eine Sicherheitsanalyse für die folgende Audiodatei durch. Prüfe auf potenziell schädliche Inhalte wie subliminale Botschaften, schädliche Frequenzen oder versteckte Daten. Gib eine Zusammenfassung der Ergebnisse in deutscher Sprache aus. Formatiere die Ausgabe als Markdown. Wenn keine Bedrohungen gefunden werden, bestätige dies deutlich.`;

    const contents = {
        parts: [
            { text: prompt },
            {
                inlineData: {
                    mimeType: audioFile.type,
                    data: base64Audio
                }
            }
        ]
    };

    try {
        const result = await ai.models.generateContent({ model, contents });
        return result.text.trim();
    } catch (error) {
        console.error("Error analyzing audio safety:", error);
        throw new Error("Die Sicherheitsanalyse ist fehlgeschlagen.");
    }
}
