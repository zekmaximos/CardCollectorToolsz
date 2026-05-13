"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { nullableText, numberValue, todayIso } from "@/lib/format";
import { createClient } from "@/utils/supabase/server";

export type ActionState = {
  ok: boolean;
  message: string;
};

const initialActionState: ActionState = { ok: false, message: "" };

function friendlyDatabaseError(error: { code?: string; message?: string } | null) {
  if (!error) {
    return "Nao foi possivel salvar agora.";
  }

  if (error.code === "42P01" || error.code === "PGRST205") {
    return "As tabelas do Supabase ainda nao foram criadas. Rode o SQL de database/schema.sql no Supabase.";
  }

  if (error.message?.toLowerCase().includes("row-level security")) {
    return "O Supabase bloqueou a gravacao por RLS. Confira as policies do arquivo database/schema.sql.";
  }

  return error.message ?? "Nao foi possivel salvar agora.";
}

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return { supabase, user };
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function createAlbum(formData: FormData): Promise<void> {
  await createAlbumWithState(initialActionState, formData);
}

export async function createAlbumWithState(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { supabase, user } = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  const description = nullableText(formData.get("description"));

  if (!name) {
    return { ok: false, message: "Informe um nome para o album." };
  }

  const { error } = await supabase.from("albums").insert({
    user_id: user.id,
    name,
    description,
  });

  if (error) {
    return { ok: false, message: friendlyDatabaseError(error) };
  }

  revalidatePath("/albums");
  return { ok: true, message: "Album criado com sucesso." };
}

export async function addCardToAlbum(formData: FormData): Promise<void> {
  const { supabase, user } = await requireUser();
  const albumId = String(formData.get("album_id") ?? "");
  const externalCardId = String(formData.get("external_card_id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();

  if (!albumId || !name) {
    return;
  }

  const { data: album } = await supabase
    .from("albums")
    .select("id")
    .eq("id", albumId)
    .eq("user_id", user.id)
    .single();

  if (!album) {
    return;
  }

  const imageUrl = nullableText(formData.get("image_url_override")) ?? nullableText(formData.get("image_url"));
  const marketSource =
    nullableText(formData.get("market_source")) ??
    (externalCardId ? null : "Manual");

  const { error } = await supabase.from("user_cards").insert({
    user_id: user.id,
    album_id: albumId,
    external_card_id: externalCardId || `manual-${randomUUID()}`,
    name,
    set_name: nullableText(formData.get("set_name")),
    card_number: nullableText(formData.get("card_number")),
    rarity: nullableText(formData.get("rarity")),
    language: nullableText(formData.get("language")),
    image_url: imageUrl,
    market_price: numberValue(formData.get("market_price")),
    market_currency: nullableText(formData.get("market_currency")),
    market_source: marketSource,
    user_value: numberValue(formData.get("user_value")),
    paid_price: numberValue(formData.get("paid_price")),
    condition: nullableText(formData.get("condition")),
    quantity: Math.max(1, Math.trunc(numberValue(formData.get("quantity")) || 1)),
    notes: nullableText(formData.get("notes")),
    acquired_at: nullableText(formData.get("acquired_at")) ?? todayIso(),
  });

  if (error) {
    return;
  }

  revalidatePath("/dashboard");
  revalidatePath("/cards/search");
  revalidatePath(`/albums/${albumId}`);
}

export async function updateUserCard(formData: FormData): Promise<void> {
  const { supabase, user } = await requireUser();
  const id = String(formData.get("id") ?? "");
  const albumId = String(formData.get("album_id") ?? "");

  if (!id) {
    return;
  }

  const { error } = await supabase
    .from("user_cards")
    .update({
      language: nullableText(formData.get("language")),
      image_url: nullableText(formData.get("image_url")),
      market_price: numberValue(formData.get("market_price")),
      market_currency: nullableText(formData.get("market_currency")),
      market_source: nullableText(formData.get("market_source")),
      condition: nullableText(formData.get("condition")),
      quantity: Math.max(1, Math.trunc(numberValue(formData.get("quantity")) || 1)),
      paid_price: numberValue(formData.get("paid_price")),
      user_value: numberValue(formData.get("user_value")),
      notes: nullableText(formData.get("notes")),
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return;
  }

  revalidatePath("/dashboard");
  revalidatePath(`/albums/${albumId}`);
}

export async function removeUserCard(formData: FormData): Promise<void> {
  const { supabase, user } = await requireUser();
  const id = String(formData.get("id") ?? "");
  const albumId = String(formData.get("album_id") ?? "");

  if (!id) {
    return;
  }

  const { error } = await supabase
    .from("user_cards")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return;
  }

  revalidatePath("/dashboard");
  revalidatePath(`/albums/${albumId}`);
}

export async function createExpense(formData: FormData): Promise<void> {
  const { supabase, user } = await requireUser();
  const itemName = String(formData.get("item_name") ?? "").trim();
  const amount = numberValue(formData.get("amount"));

  if (!itemName || amount <= 0) {
    return;
  }

  const { error } = await supabase.from("expenses").insert({
    user_id: user.id,
    expense_date: nullableText(formData.get("expense_date")) ?? todayIso(),
    category: String(formData.get("category") ?? "outro"),
    item_name: itemName,
    amount,
    notes: nullableText(formData.get("notes")),
  });

  if (error) {
    return;
  }

  revalidatePath("/dashboard");
  revalidatePath("/expenses");
  revalidatePath("/reports");
}
