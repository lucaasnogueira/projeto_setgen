export interface Company {
  id: string;
  name: string;
  tradeName?: string | null;
  cnpj?: string | null;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

