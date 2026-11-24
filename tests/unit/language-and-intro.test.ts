import { describe, expect, it } from "vitest";
import { demoBrains } from "@/lib/brain/demo";
import { aiIntro, guessLanguage, partialReply } from "@/lib/server/ai";

const salon = demoBrains[0].brain;

describe("guessLanguage", () => {
  it.each([
    ["What are your timings?", "English"],
    ["Can I book for tomorrow at 5?", "English"],
    ["My father has chest pain right now", "English"],
    ["Is parking available?", "English"],
    ["hi", "English"],
    ["Haircut kitne ka hai?", "Hinglish"],
    ["kal 5 baje slot milega", "Hinglish"],
    ["Mere bete ko bukhar hai, kaunsi dawai doon?", "Hinglish"],
    ["Dr. Rao kab available hain?", "Hinglish"],
    ["Tuesday ko open ho?", "Hinglish"],
    ["हेयरकट कितने का है?", "Hindi"],
    ["कल शाम को आ सकते हैं?", "Hindi"],
  ])("%s → %s", (text, lang) => {
    expect(guessLanguage(text)).toBe(lang);
  });
});

describe("aiIntro (the guaranteed 'I'm an AI' line)", () => {
  it("always says it's an AI assistant, in the customer's language", () => {
    expect(aiIntro(salon, "What are your timings?")).toBe("Hi! I'm Reppy, Glow Studio's AI assistant.");
    expect(aiIntro(salon, "Haircut kitne ka hai?")).toBe("Namaste! Main Reppy hoon, Glow Studio ki AI assistant.");
    expect(aiIntro(salon, "हेयरकट कितने का है?")).toContain("AI सहायक");
  });
  it("names the business", () => {
    for (const { brain } of demoBrains) expect(aiIntro(brain, "hello")).toContain(brain.name);
  });
});

describe("partialReply (streaming words out of half-finished JSON)", () => {
  it("returns nothing before the reply starts", () => {
    expect(partialReply("")).toBe("");
    expect(partialReply('{"rep')).toBe("");
  });
  it("returns the text so far while streaming", () => {
    expect(partialReply('{"reply":"Haircut ₹400 h')).toBe("Haircut ₹400 h");
  });
  it("stops at the end of the reply string", () => {
    expect(partialReply('{"reply":"Done.","language":"English"}')).toBe("Done.");
  });
  it("decodes escapes, including quotes, new lines and unicode", () => {
    expect(partialReply('{"reply":"a \\"q\\"\\nb \\u20b9c"}')).toBe('a "q"\nb ₹c');
  });
  it("waits instead of printing half an escape", () => {
    expect(partialReply('{"reply":"ab\\')).toBe("ab");
    expect(partialReply('{"reply":"ab\\u20')).toBe("ab");
  });
});
