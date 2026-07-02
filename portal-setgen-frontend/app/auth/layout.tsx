import { Zap, CheckCircle2 } from "lucide-react";

const HIGHLIGHTS = [
  "Controle de ordens de serviço em tempo real",
  "Estoque de peças com alertas de reposição",
  "Financeiro e faturamento integrados",
];

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex w-full min-h-screen bg-background">
      {/* Painel de marca */}
      <div className="hidden lg:flex w-[44%] min-w-[420px] relative overflow-hidden flex-col justify-between p-14 bg-[linear-gradient(160deg,#1c2733_0%,#20303f_55%,#17212b_100%)]">
        <div className="absolute -top-28 -right-28 w-[360px] h-[360px] rounded-full bg-[radial-gradient(circle,rgba(226,102,29,0.25),transparent_70%)]" />
        <div className="absolute -bottom-32 -left-24 w-[320px] h-[320px] rounded-full bg-[radial-gradient(circle,rgba(37,99,235,0.15),transparent_70%)]" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-[10px] bg-primary flex items-center justify-center">
            <Zap className="h-[22px] w-[22px] text-white" fill="white" />
          </div>
          <span className="text-white font-extrabold text-xl tracking-wide">SETGEN</span>
        </div>

        <div className="relative z-10">
          <h1 className="text-white text-[34px] font-extrabold leading-tight max-w-[420px] mb-4">
            Gestão completa para serviços técnicos em geradores de energia
          </h1>
          <p className="text-[#a9b4bf] text-[15px] leading-relaxed max-w-[400px] mb-8">
            Clientes, ordens de serviço, estoque e financeiro em um único portal.
          </p>
          <div className="flex flex-col gap-3.5">
            {HIGHLIGHTS.map((h) => (
              <div key={h} className="flex items-center gap-3 text-[#d7dee5] text-sm">
                <CheckCircle2 className="h-[18px] w-[18px] text-primary shrink-0" strokeWidth={2.2} />
                {h}
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-[#5b6672] text-xs">
          © {new Date().getFullYear()} Setgen Serviços Técnicos
        </div>
      </div>

      {/* Formulário */}
      <div className="flex-1 flex items-center justify-center p-10">
        <div className="w-full max-w-[380px]">{children}</div>
      </div>
    </div>
  );
}
