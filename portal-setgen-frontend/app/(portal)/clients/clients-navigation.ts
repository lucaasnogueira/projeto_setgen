import { NavItem } from "@/hooks/useNavigationWithPermissions";
import { Users, UserPlus, ListFilter, MapPin, FileSpreadsheet } from "lucide-react";

export const CLIENTS_NAVIGATION: NavItem[] = [
  {
    label: "Visão Geral",
    href: "/clients",
    icon: Users,
  },
  {
    label: "Gestão da Carteira",
    icon: ListFilter,
    children: [
      {
        label: "Lista de Clientes",
        href: "/clients/list",
        requiredPermissions: ["clients:view"],
      },
      {
        label: "Novo Cadastro",
        href: "/clients/new",
        requiredPermissions: ["clients:create"],
      },
    ],
  },
  {
    label: "Operações & Campo",
    icon: FileSpreadsheet,
    children: [
      {
        label: "Mapa de Plantas & Postos",
        href: "/clients/map",
        requiredPermissions: ["clients:view"],
      },
    ],
  },
];

