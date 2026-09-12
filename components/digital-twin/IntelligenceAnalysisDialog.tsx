"use client";

import { FC, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useChat } from "@ai-sdk/react";
import { MemoizedMarkdown } from "@/components/copilot/memoized-markdown";
import AILoadingState from "@/components/ui/ai-loading-state";

interface IntelligenceAnalysisDialogProps {
  isOpen: boolean;
  onClose: () => void;
  supplyChainId: string | null;
}

type Status = "idle" | "streaming" | "completed" | "error";

function SuccessRedirect({ onGoToDashboard, onClose }: { onGoToDashboard: () => void; onClose: () => void }) {
  const router = useRouter();

  const handleGoToDashboard = () => {
    onGoToDashboard();
    router.push('/dashboard');
  };

  return (
    <div className="flex flex-col justify-between h-full w-full min-h-[400px]">
      <div className="text-center flex-grow flex flex-col justify-center items-center">
        <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
        <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">
          Analysis Complete
        </h3>
        <p className="mt-2 text-gray-500 dark:text-gray-400 max-w-sm">
          We have successfully analyzed your supply chain.
        </p>
      </div>
      <div className="pt-4 mt-4 w-full flex gap-3">
        <Button
          onClick={onClose}
          className="flex-1 shadow-md"
          variant="default"
        >
          Continue Editing
        </Button>
        <Button
          onClick={handleGoToDashboard}
          className="flex-1 shadow-md"
          variant="secondary"
        >
          Go to Dashboard
        </Button>
      </div>
    </div>
  );
}

function ErrorRedirect({ onGoToDashboard, error }: { onGoToDashboard: () => void; error?: Error }) {
  const router = useRouter();

  const handleGoToDashboard = () => {
    onGoToDashboard();
    router.push('/dashboard');
  };

  return (
    <div className="flex flex-col justify-between h-full w-full min-h-[400px]">
      <div className="text-center flex-grow flex flex-col justify-center items-center">
        <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center mb-4">
          <span className="text-orange-500 text-2xl">⚠️</span>
        </div>
        <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">
          Analysis Temporarily Unavailable
        </h3>
        <p className="mt-2 text-gray-500 dark:text-gray-400 max-w-sm">
          Don't worry! Our system will continue trying to analyze your supply chain in the background. 
          You can return to the dashboard and check back later.
        </p>
        <p className="mt-4 text-sm text-gray-400 dark:text-gray-500 max-w-md">
          We'll notify you once the analysis is complete. No action is required from your side.
        </p>
      </div>
      <div className="pt-4 mt-4 w-full">
        <Button
          onClick={handleGoToDashboard}
          className="w-full shadow-md"
          variant="secondary"
        >
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
}

const IntelligenceAnalysisDialog: FC<IntelligenceAnalysisDialogProps> = ({
  isOpen,
  onClose,
  supplyChainId,
}) => {
  const contentRef = useRef<HTMLDivElement>(null);

  // --- useChat integration --------------------------------------------------
  const {
    messages,
    append,
    setMessages,
    isLoading,
    error,
    status: chatStatus,
  } = useChat({
    api: "/api/agent/info",
    body: supplyChainId
      ? {
          supply_chain_id: supplyChainId,
          stream: true,
        }
      : undefined,
    // Use a deterministic chat id per supply chain so the state resets between different analyses
    id: supplyChainId ? `intel-${supplyChainId}` : undefined,
  });

  // Track high-level status for UI copy / button disable logic
  const [status, setStatus] = useState<Status>("idle");

  // Trigger the analysis when the dialog is opened
  useEffect(() => {
    if (isOpen && supplyChainId) {
      // Reset any previous messages
      setMessages([]);

      // Send a user message to kick off the analysis
      append({
        role: "user",
        content: `Please provide a comprehensive intelligence analysis for supply chain ID ${supplyChainId}.`,
      }).catch((err) => console.error("Failed to send analysis request:", err));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, supplyChainId]);

  // Derive UI status from chatStatus / error
  useEffect(() => {
    if (error) {
      setStatus("error");
    } else if (chatStatus === "streaming" || chatStatus === "submitted" || isLoading) {
      setStatus("streaming");
    } else if (messages.some((m) => m.role === "assistant")) {
      setStatus("completed");
    } else {
      setStatus("idle");
    }
  }, [chatStatus, error, isLoading, messages]);

  // Auto-scroll when messages update
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleClose = () => {
    // Prevent closing while streaming unless error
    if (status !== "streaming") {
      onClose();
    }
  };

  const handleGoToDashboard = () => {
    onClose();
  };

  const assistantMessages = messages.filter((m) => m.role === "assistant");

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl w-full mx-4 p-8 rounded-xl shadow-2xl bg-blue-50/80 dark:bg-slate-900/50 border-slate-200/80 dark:border-slate-700/60">

        {/* Main content area */}
        {status === "streaming" ? (
          <AILoadingState
            content={assistantMessages.map((m) => m.content).join("\n")}
          />
        ) : status === "completed" ? (
          <SuccessRedirect onGoToDashboard={handleGoToDashboard} onClose={onClose} />
        ) : status === "error" ? (
          <ErrorRedirect onGoToDashboard={handleGoToDashboard} error={error} />
        ) : (
          <div
            ref={contentRef}
            className="prose dark:prose-invert prose-sm max-w-none h-96 overflow-y-auto bg-gray-50 dark:bg-gray-800 rounded-md p-4 border border-gray-200 dark:border-gray-700 my-4"
          >
            {assistantMessages.map((m) => (
              <MemoizedMarkdown key={m.id} content={m.content} id={m.id} />
            ))}
          </div>
        )}

      </DialogContent>
    </Dialog>
  );
};

export default IntelligenceAnalysisDialog; 