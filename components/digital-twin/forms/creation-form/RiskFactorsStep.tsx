"use client"

import { useFormContext } from "react-hook-form";
import { motion } from "framer-motion";
import {
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { MultiSelect } from "@/components/ui/multiselect";
import { RISK_FACTORS } from "@/constants/supply-chain-form";
import { FormData } from "./form-schema";

export const RiskFactorsStep = () => {
  const form = useFormContext<FormData>();

  return (
    <motion.div
      key="step-2"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: [0.4, 0.0, 0.2, 1] }}
      className="space-y-4"
    >
      <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 shadow-md shadow-slate-200/50 dark:shadow-slate-900/50 p-4 backdrop-blur-sm">
        <FormField
          control={form.control}
          name="risks"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base font-semibold text-slate-800 dark:text-slate-200">
                Potential Risk Factors
              </FormLabel>
              <FormDescription className="text-sm text-slate-500 dark:text-slate-400 !mb-3 !mt-1">
                Select all risks that could impact your supply chain operations.
              </FormDescription>
              <div className="shadow-sm">
                <MultiSelect
                  options={RISK_FACTORS}
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  placeholder="Select risks..."
                  className="border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-slate-400 dark:hover:border-slate-500 transition-colors"
                />
              </div>
              <FormMessage className="!mt-1.5 text-xs" />
            </FormItem>
          )}
        />
      </div>
    </motion.div>
  );
}; 