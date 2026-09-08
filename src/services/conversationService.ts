import { supabase } from "./supabase";

export type ConversationRow = {
id: string;
user_id: string;
character_id: string;
title: string | null;
is_active: boolean;
last_message_at: string | null;
created_at: string;
updated_at: string;
};

/* ============================================================
GET CURRENT USER
============================================================ */

async function getCurrentUserId(): Promise<string> {
const {
data: { user },
error,
} = await supabase.auth.getUser();

if (error) {
console.error(
"Failed to get current user:",
error
);


throw error;


}

if (!user) {
throw new Error(
"User must be signed in."
);
}

return user.id;
}

/* ============================================================
GET EXISTING CHARACTER CONVERSATION
============================================================ */

export async function getCharacterConversation(
characterId: string
): Promise<ConversationRow | null> {
if (!characterId) {
throw new Error(
"Character ID is required."
);
}

const userId =
await getCurrentUserId();

const { data, error } =
await supabase
.from("conversations")
.select("*")
.eq("user_id", userId)
.eq("character_id", characterId)
.eq("is_active", true)
.order(
"last_message_at",
{
ascending: false,
nullsFirst: false,
}
)
.limit(1)
.maybeSingle();

if (error) {
console.error(
"Failed to get character conversation:",
error
);


throw error;


}

return data as ConversationRow | null;
}

/* ============================================================
GET OR CREATE CONVERSATION
============================================================ */

export async function getOrCreateCharacterConversation(
characterId: string,
characterName: string
): Promise<ConversationRow> {
if (!characterId) {
throw new Error(
"Character ID is required."
);
}

const existing =
await getCharacterConversation(
characterId
);

if (existing) {
return existing;
}

const userId =
await getCurrentUserId();

const {
data,
error,
} = await supabase
.from("conversations")
.insert({
user_id: userId,
character_id: characterId,
title: characterName
? `Chat with ${characterName}`
: "New Conversation",
is_active: true,
})
.select("*")
.single();

if (error) {
console.error(
"Failed to create conversation:",
error
);


throw error;


}

return data as ConversationRow;
}

/* ============================================================
UPDATE LAST MESSAGE TIME
============================================================ */

export async function touchConversation(
conversationId: string,
timestamp = new Date().toISOString()
): Promise<void> {
if (!conversationId) {
return;
}

const {
error,
} = await supabase
.from("conversations")
.update({
last_message_at: timestamp,
updated_at: timestamp,
})
.eq(
"id",
conversationId
);

if (error) {
console.error(
"Failed to update conversation:",
error
);


throw error;


}
}

/* ============================================================
DELETE CONVERSATION
============================================================ */

export async function deleteConversation(
conversationId: string
): Promise<void> {
if (!conversationId) {
return;
}

const {
error,
} = await supabase
.from("conversations")
.delete()
.eq(
"id",
conversationId
);

if (error) {
console.error(
"Failed to delete conversation:",
error
);


throw error;


}
}

/* ============================================================
TEST
============================================================ */

export async function testConversationService(
characterId: string,
characterName: string
): Promise<void> {
try {
console.log(
"💬 Testing conversation service..."
);


const conversation =
  await getOrCreateCharacterConversation(
    characterId,
    characterName
  );

console.log(
  "✅ Conversation:",
  conversation
);

console.log(
  "✅ Conversation service test completed."
);


} catch (error) {
console.error(
"❌ Conversation service test failed:",
error
);
}
}
