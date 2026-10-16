// Exportações dos componentes comuns modularizados do Portal Setgen

// 1. Wizard e Fluxos de Etapas
export { HorizontalStepper, type StepItem } from "./wizard/HorizontalStepper";
export { WizardHeader } from "./wizard/WizardHeader";
export { WizardFooter, type WizardFooterProps } from "./wizard/WizardFooter";

// 2. Modais e Diálogos Centralizados
export { CenteredModal, type CenteredModalProps } from "./modal/CenteredModal";
export { SubEntityModal, type SubEntityType, type CreatedSubEntity } from "./modal/SubEntityModal";

// 3. Multi-CRUD e Resumos em Tempo Real
export {
  MultiCrudInlineTable,
  type MultiCrudItem,
  type CatalogOption,
  type MultiCrudInlineTableProps,
} from "./multi-crud/MultiCrudInlineTable";
export {
  FormLiveSummary,
  type CostBreakdownItem,
  type FormLiveSummaryProps,
} from "./multi-crud/FormLiveSummary";

// 4. Layout e Navegação
export {
  ModuleSwitcherModal,
  type PortalModule,
  type ModuleSwitcherModalProps,
} from "./layout/ModuleSwitcherModal";

