"use client"
import { Globe } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface InternetSearchIconProps {
    internet: boolean
    setInternet: (value: boolean) => void
    status: boolean
    showSearch: boolean
}

export default function InternetSearchIcon({
    internet,
    setInternet,
    status,
    showSearch,
}: InternetSearchIconProps) {
    const button = (
        <button
            type="button"
            disabled={status}
            onClick={() => setInternet(!internet)}
            className={cn(
                "rounded-full transition-all flex items-center gap-1.5 px-1.5 py-1 border h-7",
                status
                    ? "bg-gray-200 dark:bg-gray-800 border-gray-300 cursor-not-allowed opacity-50"
                    : showSearch || internet
                        ? "bg-sky-500/15 border-sky-400 text-sky-500 px-1.5"
                        : "bg-neutral-200 dark:bg-gray-900 border-transparent hover:bg-neutral-300 dark:hover:bg-gray-800",
            )}
        >
            <div className="w-3.5 h-3.5 flex items-center justify-center flex-shrink-0">
                <motion.div
                    animate={{
                        rotate: showSearch ? 180 : 0,
                        scale: showSearch ? 1.1 : 1,
                    }}
                    whileHover={{
                        rotate: showSearch ? 180 : 15,
                        scale: 1.1,
                        transition: {
                            type: "spring",
                            stiffness: 300,
                            damping: 10,
                        },
                    }}
                    transition={{
                        type: "spring",
                        stiffness: 260,
                        damping: 25,
                    }}
                >
                    <Globe className={cn("w-3.5 h-3.5 transition-colors", (showSearch || internet) ? "text-sky-500" : "text-neutral-600 dark:text-neutral-400")} />
                </motion.div>
            </div>
            <AnimatePresence>
                {internet && (
                    <motion.span
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: "auto", opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="text-xs overflow-hidden whitespace-nowrap text-sky-500 flex-shrink-0"
                    >
                        Search
                    </motion.span>
                )}
            </AnimatePresence>
        </button>
    )

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>{button}</TooltipTrigger>
                <TooltipContent>
                    <p>Click to turn web search {internet ? 'off' : 'on'}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
} 