import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import type { Product } from "@/types/product";
import {
  Trash2, Plus, LogOut, Loader2, ImagePlus,
  ShoppingBag, Package, ChevronDown, ChevronUp,
} from "lucide-react";

const ADMIN_PASSWORD = "chevar2025";

interface OrderItem {
  name?: string;
  quantity: number;
  price: number;
}

interface Order {
  id: number;
  full_name: string;
  phone: string;
  note: string;
  total_price: number;
  items: OrderItem[];
  created_at: string;
}

export default function Admin() {
  const [authed, setAuthed] = useState(false);
  const [pw, setPw] = useState("");
  const [pwError, setPwError] = useState(false);
  const [tab, setTab] = useState<"products" | "orders">("products");

  // Products
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [addError, setAddError] = useState("");
  const [form, setForm] = useState({ name: "", description: "", price: "" });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const fileRef = useRef<HTMLInputElement>(null);

  // Orders
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);

  useEffect(() => {
    if (!authed) return;
    if (tab === "products") loadProducts();
    if (tab === "orders") loadOrders();
  }, [authed, tab]);

  async function loadProducts() {
    setLoadingProducts(true);
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error) setProducts((data as Product[]) ?? []);
    setLoadingProducts(false);
  }

  async function loadOrders() {
    setLoadingOrders(true);
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error) setOrders((data as Order[]) ?? []);
    setLoadingOrders(false);
  }

  function handleLogin() {
    if (pw === ADMIN_PASSWORD) { setAuthed(true); setPwError(false); }
    else setPwError(true);
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function toBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setAddError("");
    if (!form.name || !form.price) return;
    setSaving(true);

    let image_url = "";
    if (imageFile) {
      try {
        image_url = await toBase64(imageFile);
      } catch {
        setAddError("Rasm o'qishda xatolik");
        setSaving(false);
        return;
      }
    }

    const { error } = await supabase.from("products").insert([{
      name: form.name,
      description: form.description,
      price: Number(form.price),
      image_url,
    }]);

    if (error) {
      setAddError(`Xatolik: ${error.message}`);
    } else {
      setForm({ name: "", description: "", price: "" });
      setImageFile(null);
      setImagePreview("");
      if (fileRef.current) fileRef.current.value = "";
      await loadProducts();
    }
    setSaving(false);
  }

  async function handleDelete(id: number) {
    setDeleting(id);
    await supabase.from("products").delete().eq("id", id);
    setProducts(prev => prev.filter(p => p.id !== id));
    setDeleting(null);
  }

  async function handleDeleteOrder(id: number) {
    await supabase.from("orders").delete().eq("id", id);
    setOrders(prev => prev.filter(o => o.id !== id));
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleString("uz-UZ", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  }

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm">
          <h1 className="text-2xl font-bold mb-6 text-center">Admin kirish</h1>
          <input
            type="password"
            placeholder="Parol"
            value={pw}
            onChange={e => setPw(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleLogin()}
            className="w-full border rounded-lg px-4 py-2.5 mb-3 outline-none focus:ring-2 focus:ring-amber-400"
          />
          {pwError && <p className="text-red-500 text-sm mb-3">Parol noto'g'ri</p>}
          <button
            onClick={handleLogin}
            className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-lg py-2.5 transition"
          >
            Kirish
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between shadow-sm">
        <h1 className="text-xl font-bold">Chevar Admin Panel</h1>
        <button
          onClick={() => setAuthed(false)}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-500 transition"
        >
          <LogOut className="w-4 h-4" /> Chiqish
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b px-6 flex gap-1">
        <button
          onClick={() => setTab("products")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition ${
            tab === "products"
              ? "border-amber-500 text-amber-600"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          <Package className="w-4 h-4" />
          Mahsulotlar
          <span className="text-xs bg-gray-100 rounded-full px-2 py-0.5">{products.length}</span>
        </button>
        <button
          onClick={() => setTab("orders")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition ${
            tab === "orders"
              ? "border-amber-500 text-amber-600"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          Buyurtmalar
          <span className="text-xs bg-gray-100 rounded-full px-2 py-0.5">{orders.length}</span>
        </button>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* PRODUCTS TAB */}
        {tab === "products" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Add form */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow p-6">
                <h2 className="font-semibold text-lg mb-5 flex items-center gap-2">
                  <Plus className="w-5 h-5 text-amber-500" /> Mahsulot qo'shish
                </h2>
                <form onSubmit={handleAdd} className="flex flex-col gap-4">
                  <div
                    onClick={() => fileRef.current?.click()}
                    className="cursor-pointer border-2 border-dashed border-gray-200 rounded-xl h-44 flex flex-col items-center justify-center overflow-hidden hover:border-amber-400 transition"
                  >
                    {imagePreview ? (
                      <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <ImagePlus className="w-8 h-8 text-gray-300 mb-2" />
                        <span className="text-sm text-gray-400">Rasm tanlang</span>
                      </>
                    )}
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />

                  <input
                    placeholder="Mahsulot nomi *"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    required
                    className="border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-400"
                  />
                  <input
                    placeholder="Narxi (so'm) *"
                    type="number"
                    value={form.price}
                    onChange={e => setForm({ ...form, price: e.target.value })}
                    required
                    className="border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-400"
                  />
                  <textarea
                    placeholder="Tavsif"
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    rows={3}
                    className="border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-400 resize-none"
                  />
                  {addError && (
                    <p className="text-red-500 text-xs bg-red-50 p-2 rounded-lg">{addError}</p>
                  )}
                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-lg py-2.5 transition flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    {saving ? "Saqlanmoqda..." : "Qo'shish"}
                  </button>
                </form>
              </div>
            </div>

            {/* Products list */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow p-6">
                <h2 className="font-semibold text-lg mb-5">
                  Mahsulotlar <span className="text-sm font-normal text-gray-400">({products.length} ta)</span>
                </h2>
                {loadingProducts ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
                  </div>
                ) : products.length === 0 ? (
                  <p className="text-center text-gray-400 py-16">Mahsulotlar yo'q</p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {products.map(p => (
                      <div key={p.id} className="flex items-center gap-4 p-3 border rounded-xl hover:bg-gray-50 transition">
                        <img
                          src={p.image_url || "/placeholder.svg"}
                          alt={p.name}
                          className="w-16 h-16 object-cover rounded-lg shrink-0 bg-gray-100"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{p.name}</p>
                          <p className="text-amber-600 font-semibold text-sm">
                            {Number(p.price).toLocaleString()} so'm
                          </p>
                          {p.description && (
                            <p className="text-xs text-gray-400 truncate mt-0.5">{p.description}</p>
                          )}
                        </div>
                        <button
                          onClick={() => handleDelete(p.id)}
                          disabled={deleting === p.id}
                          className="p-2 text-gray-400 hover:text-red-500 transition disabled:opacity-50 shrink-0"
                        >
                          {deleting === p.id
                            ? <Loader2 className="w-4 h-4 animate-spin" />
                            : <Trash2 className="w-4 h-4" />}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ORDERS TAB */}
        {tab === "orders" && (
          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="font-semibold text-lg mb-5">
              Buyurtmalar <span className="text-sm font-normal text-gray-400">({orders.length} ta)</span>
            </h2>
            {loadingOrders ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
              </div>
            ) : orders.length === 0 ? (
              <p className="text-center text-gray-400 py-16">Buyurtmalar yo'q</p>
            ) : (
              <div className="flex flex-col gap-3">
                {orders.map(order => (
                  <div key={order.id} className="border rounded-xl overflow-hidden">
                    {/* Order header */}
                    <div
                      className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition"
                      onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 font-bold text-sm shrink-0">
                          #{order.id}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{order.full_name}</p>
                          <p className="text-xs text-gray-500">{order.phone}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                          <p className="font-bold text-amber-600 text-sm">
                            {Number(order.total_price).toLocaleString()} so'm
                          </p>
                          <p className="text-xs text-gray-400">{formatDate(order.created_at)}</p>
                        </div>
                        <button
                          onClick={e => { e.stopPropagation(); handleDeleteOrder(order.id); }}
                          className="p-1.5 text-gray-400 hover:text-red-500 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        {expandedOrder === order.id
                          ? <ChevronUp className="w-4 h-4 text-gray-400" />
                          : <ChevronDown className="w-4 h-4 text-gray-400" />}
                      </div>
                    </div>

                    {/* Expanded details */}
                    {expandedOrder === order.id && (
                      <div className="border-t bg-gray-50 p-4 space-y-3">
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-gray-500">Ism:</span>{" "}
                            <span className="font-medium">{order.full_name}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Tel:</span>{" "}
                            <a href={`tel:${order.phone}`} className="font-medium text-amber-600">{order.phone}</a>
                          </div>
                          <div>
                            <span className="text-gray-500">Sana:</span>{" "}
                            <span className="font-medium">{formatDate(order.created_at)}</span>
                          </div>
                          {order.note && (
                            <div className="col-span-2">
                              <span className="text-gray-500">Izoh:</span>{" "}
                              <span className="font-medium">{order.note}</span>
                            </div>
                          )}
                        </div>

                        {/* Items */}
                        <div className="border rounded-lg overflow-hidden">
                          <table className="w-full text-sm">
                            <thead className="bg-gray-100">
                              <tr>
                                <th className="text-left px-3 py-2 font-medium text-gray-600">Mahsulot</th>
                                <th className="text-center px-3 py-2 font-medium text-gray-600">Soni</th>
                                <th className="text-right px-3 py-2 font-medium text-gray-600">Narxi</th>
                                <th className="text-right px-3 py-2 font-medium text-gray-600">Jami</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(order.items || []).map((item, i) => (
                                <tr key={i} className="border-t">
                                  <td className="px-3 py-2">{item.name || `Mahsulot #${i + 1}`}</td>
                                  <td className="px-3 py-2 text-center">{item.quantity}</td>
                                  <td className="px-3 py-2 text-right">{Number(item.price).toLocaleString()}</td>
                                  <td className="px-3 py-2 text-right font-medium">
                                    {(item.quantity * item.price).toLocaleString()} so'm
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot className="bg-amber-50 border-t">
                              <tr>
                                <td colSpan={3} className="px-3 py-2 font-semibold text-right">Jami:</td>
                                <td className="px-3 py-2 font-bold text-amber-600 text-right">
                                  {Number(order.total_price).toLocaleString()} so'm
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
