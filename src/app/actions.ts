"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { nullableText, numberValue, todayIso } from "@/lib/format";
import { createClient } from "@/utils/supabase/server";

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
  const { supabase, user } = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  const description = nullableText(formData.get("description"));

  if (!name) {
    return;
  }

  const { error } = await supabase.from("albums").insert({
    user_id: user.id,
    name,
    description,
  });

  if (error) {
    return;
  }

  revalidatePath("/albums");
}

export async function addCardToAlbum(formData: FormData): Promise<void> {
  const { supabase, user } = await requireUser();
  const albumId = String(formData.get("album_id") ?? "");
  const externalCardId = String(formData.get("external_card_id") ?? "");
  const name = String(formData.get("name") ?? "").trim();

  if (!albumId || !externalCardId || !name) {
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

  const { error } = await supabase.from("user_cards").insert({
    user_id: user.id,
    album_id: albumId,
    external_card_id: externalCardId,
    name,
    set_name: nullableText(formData.get("set_name")),
    card_number: nullableText(formData.get("card_number")),
    rarity: nullableText(formData.get("rarity")),
    language: nullableText(formData.get("language")),
    image_url: nullableText(formData.get("image_url")),
    market_price: numberValue(formData.get("market_price")),
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
