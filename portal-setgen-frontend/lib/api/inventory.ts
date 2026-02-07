import api from "./client";
import { Product } from "@/types";

export const inventoryApi = {
  async getAll(): Promise<Product[]> {
    try {
      const { data } = await api.get("/inventory/products");
      return data;
    } catch (error) {
      console.error("Erro ao buscar estoque:", error);
      return [];
    }
  },

  async getById(id: string): Promise<Product> {
    const { data } = await api.get(`/inventory/products/${id}`);
    return data;
  },

  async create(itemData: Partial<Product>): Promise<Product> {
    const { data } = await api.post("/inventory/products", itemData);
    return data;
  },

  async update(id: string, itemData: Partial<Product>): Promise<Product> {
    const { data } = await api.patch(`/inventory/products/${id}`, itemData);
    return data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/inventory/products/${id}`);
  },

  async adjustStock(
    productId: string,
    quantity: number,
    type: "ENTRY" | "EXIT" | "ADJUSTMENT" | "TRANSFER",
  ) {
    const { data } = await api.post("/inventory/movements", {
      productId,
      quantity,
      type,
    });

    return data;
  },
};
