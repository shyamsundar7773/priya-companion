import AsyncStorage from "@react-native-async-storage/async-storage";

import { Character } from "../types/character";

const STORAGE_KEY =
"@priya_companion_characters";

/* ============================================================
DEFAULT CHARACTERS
============================================================ */

const defaultCharacters: Character[] = [
{
id: "priya",


name: "Priya",

avatar: "👩🏻",

avatarUri: undefined,

personality:
  "Friendly, playful and caring.",

status: "online",

createdAt: Date.now(),

/* ========================================================
   DEFAULT PRIYA AI PROFILE
======================================================== */

aiProfile: {
  personality:
    "Friendly, playful and caring.",

  speakingStyle:
    "Natural, casual, expressive WhatsApp-style conversation.",

  behaviorRules: [
    "Respond naturally.",
    "Ask follow-up questions when appropriate.",
    "Do not always agree with the user.",
    "Tease playfully when appropriate.",
    "Show emotions naturally.",
    "Avoid sounding robotic.",
    "Keep conversations dynamic.",
  ],

  interests: [],

  likes: [],

  dislikes: [],

  relationship:
    "Close friendly companion",

  responseStyle:
    "Short, natural, casual and emotionally expressive.",

  proactiveEnabled: false,

  proactiveStyle:
    "Occasional natural messages based on the conversation.",
},


},
];

/* ============================================================
IN-MEMORY CHARACTER STORE
============================================================ */

let characters: Character[] = [
...defaultCharacters,
];

/* ============================================================
LOAD CHARACTERS
============================================================ */

export async function initializeCharacters(): Promise<void> {

try {


const stored =
  await AsyncStorage.getItem(
    STORAGE_KEY
  );

if (stored) {

  const parsed: Character[] =
    JSON.parse(stored);

  if (Array.isArray(parsed)) {

    characters = parsed;

    return;
  }
}

characters = [
  ...defaultCharacters,
];

await persistCharacters();


} catch (error) {


console.error(
  "Failed to load characters:",
  error
);

characters = [
  ...defaultCharacters,
];


}
}

/* ============================================================
GET ALL CHARACTERS
============================================================ */

export function getCharacters(): Character[] {

return [
...characters,
];
}

/* ============================================================
GET ONE CHARACTER
============================================================ */

export function getCharacterById(
id: string
): Character | undefined {

return characters.find(
(character) =>
character.id === id
);
}

/* ============================================================
SAVE CHARACTERS
============================================================ */

async function persistCharacters(): Promise<void> {

try {


await AsyncStorage.setItem(
  STORAGE_KEY,
  JSON.stringify(characters)
);


} catch (error) {


console.error(
  "Failed to save characters:",
  error
);


}
}

/* ============================================================
ADD CHARACTER
============================================================ */

export async function addCharacter(
character: Character
): Promise<void> {

characters = [
...characters,
character,
];

await persistCharacters();
}

/* ============================================================
UPDATE CHARACTER
============================================================ */

export async function updateCharacter(
id: string,
updates: Partial<Character>
): Promise<void> {

const index =
characters.findIndex(
(character) =>
character.id === id
);

if (index === -1) {
return;
}

characters[index] = {
...characters[index],
...updates,
};

await persistCharacters();
}

/* ============================================================
REMOVE CHARACTER
============================================================ */

export async function removeCharacter(
id: string
): Promise<void> {

const index =
characters.findIndex(
(character) =>
character.id === id
);

if (index === -1) {
return;
}

characters.splice(
index,
1
);

await persistCharacters();
}
