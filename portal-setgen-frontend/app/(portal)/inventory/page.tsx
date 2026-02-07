"use client";

import { useState, useEffect } from "react";
import { inventoryApi } from "@/lib/api/inventory";
import { Product } from "@/types";

import {
  Package,
  Plus,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import Link from 'next/link';

export default function InventoryPage() {
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    inventoryApi
      .getAll()
      .then(setItems)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="flex justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );

  const lowStockItems = items.filter(
    (item) => item.currentStock <= item.minStock,
  );

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Estoque</h1>
            <p className="text-amber-100">
              {lowStockItems.length > 0 &&
                `${lowStockItems.length} itens com estoque baixo`}
            </p>
          </div>
          <Package className="h-16 w-16 opacity-50" />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex justify-between items-center">
          <div className="flex gap-4">
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-green-600" />
              Entrada
            </button>

            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-red-600" />
              Saída
            </button>
          </div>

          <Link href="/inventory/new">
            <button className="px-6 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg hover:from-amber-600 hover:to-amber-700 flex items-center gap-2 shadow-lg">
              <Plus className="h-4 w-4" />
              Novo Produto
            </button>
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                  Produto
                </th>

                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                  Código
                </th>

                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                  Estoque Atual
                </th>

                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                  Estoque Mínimo
                </th>

                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                  Preço Unitário
                </th>

                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                  Unid./Caixa
                </th>

                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                  Status
                </th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 font-medium">
                      Nenhum produto cadastrado
                    </p>
                  </td>
                </tr>
              ) : (
                items.map((item) => {
                  const isLowStock = item.currentStock <= item.minStock;

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              isLowStock ? "bg-red-100" : "bg-amber-100"
                            }`}
                          >
                            <Package
                              className={`h-5 w-5 ${
                                isLowStock ? "text-red-600" : "text-amber-600"
                              }`}
                            />
                          </div>

                          <div>
                            <p className="font-medium text-gray-900">
                              {item.name}
                            </p>

                            <p className="text-xs text-gray-500">
                              {item.description}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-sm text-gray-600">
                        {item.code}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`font-semibold ${
                            isLowStock ? "text-red-600" : "text-gray-900"
                          }`}
                        >
                          {item.currentStock} {item.unit}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-sm text-gray-600">
                        {item.minStock} {item.unit}
                      </td>

                      <td className="px-6 py-4">
                        {item.unitPrice ? (
                          <span className="font-semibold text-green-600">
                            {item.unitPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400 italic">Não definido</span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-sm text-gray-600">
                        {item.unitsPerPackage ? (
                          <div>
                            <span className="font-medium">{item.unitsPerPackage} unidades</span>
                            {item.unitPrice && (
                              <p className="text-xs text-gray-500 mt-1">
                                Caixa: {(item.unitPrice * item.unitsPerPackage).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">-</span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        {isLowStock ? (
                          <span className="flex items-center gap-1 text-red-600">
                            <AlertTriangle className="h-4 w-4" />
                            <span className="text-sm font-medium">
                              Estoque Baixo
                            </span>
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                            OK
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
