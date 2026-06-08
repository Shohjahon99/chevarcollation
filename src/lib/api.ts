import { supabase } from "./supabase";
import type { Product } from "@/types/product";

export async function fetchProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data as Product[]) ?? [];
}

export const fetchProductById = async (id: string | number): Promise<Product> => {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw new Error(error.message);
  return data as Product;
};

export interface OrderPayload {
  fullName: string;
  phone: string;
  note?: string;
  totalPrice: number;
  items: { productId: number; quantity: number; name?: string; price?: number }[];
}

export async function submitOrder(payload: OrderPayload): Promise<void> {
  const { error } = await supabase.from("orders").insert([{
    full_name: payload.fullName,
    phone: payload.phone,
    note: payload.note ?? "",
    total_price: payload.totalPrice,
    items: payload.items,
  }]);
  if (error) throw new Error(error.message);
}
