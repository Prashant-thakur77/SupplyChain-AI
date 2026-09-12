import { Construction, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function RiskPredictionWIP() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center p-8 text-center h-[80vh]">
      <div className="w-20 h-20 bg-theme-blue/10 rounded-full flex items-center justify-center mb-6 animate-pulse">
        <Construction className="w-10 h-10 text-theme-blue" />
      </div>
      
      <h1 className="text-3xl font-bold text-theme-text-primary mb-4 tracking-tight">
        Risk ML Integration
      </h1>
      
      <p className="text-theme-text-secondary max-w-lg mb-8 leading-relaxed">
        We are currently upgrading our dedicated Machine Learning Risk Prediction hub. 
        In the meantime, the XGBoost ML model has been natively integrated directly into the Digital Twin canvas!
      </p>
      
      <div className="flex gap-4">
        <Link href="/digital-twin">
          <Button variant="default" className="bg-theme-blue hover:bg-theme-blue/90 text-white font-semibold shadow-sm">
            Go to Digital Twin
          </Button>
        </Link>
        <Link href="/dashboard">
          <Button variant="outline" className="border-theme-border-subtle hover:bg-theme-bg-secondary text-theme-text-primary font-semibold">
            Back to Dashboard
          </Button>
        </Link>
      </div>
    </main>
  );
}
