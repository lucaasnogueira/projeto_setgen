import api from "./client";
import { Product, StockMovement, MovementType } from "@/types";

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

  async createMovement(payload: {
    productId: string;
    quantity: number;
    type: MovementType;
    unitCost?: number;
    reason?: string;
  }): Promise<StockMovement> {
    const { data } = await api.post("/inventory/movements", payload);
    return data;
  },

  async uploadPhoto(id: string, file: File): Promise<Product> {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await api.post(`/inventory/products/${id}/photo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  async getByBarcode(barcode: string): Promise<Product> {
    const { data } = await api.get(`/inventory/products/barcode/${encodeURIComponent(barcode)}`);
    return data;
  },

  async createMovementBatch(payload: {
    type: MovementType;
    reason?: string;
    referenceId?: string;
    items: { productId: string; quantity: number }[];
  }): Promise<StockMovement[]> {
    const { data } = await api.post("/inventory/movements/batch", payload);
    return data;
  },
};
