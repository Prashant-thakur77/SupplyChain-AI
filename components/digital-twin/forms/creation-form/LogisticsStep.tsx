"use client"

import { useFormContext } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { MultiSelect } from "@/components/ui/multiselect";
import { CurrencySelect } from "@/components/ui/currency-selector";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  SHIPPING_METHODS,
  ANNUAL_VOLUME_TYPES,
} from "@/constants/supply-chain-form";
import { FormData } from "./form-schema";

export const LogisticsStep = () => {
  const form = useFormContext<FormData>();

  return (
    <motion.div
      key="step-1"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: [0.4, 0.0, 0.2, 1] }}
      className="space-y-4"
    >
      <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 shadow-md shadow-slate-200/50 dark:shadow-slate-900/50 p-4 backdrop-blur-sm">
        <div className="mb-4">
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-1">Logistics & Shipping</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Define your currency and shipping methods.</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-6 gap-y-4">
          <FormField
            control={form.control}
            name="currency"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-slate-800 dark:text-slate-200">Currency</FormLabel>
                <CurrencySelect 
                  {...field} 
                  onValueChange={field.onChange} 
                />
                <FormMessage className="!mt-1.5 text-xs"/>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="shippingMethods"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-slate-800 dark:text-slate-200">Shipping Methods</FormLabel>
                <div className="shadow-sm">
                  <MultiSelect
                    options={SHIPPING_METHODS}
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    placeholder="Select methods..."
                    className="border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-slate-400 dark:hover:border-slate-500 transition-colors"
                  />
                </div>
                <FormMessage className="!mt-1.5 text-xs"/>
              </FormItem>
            )}
          />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 shadow-md shadow-slate-200/50 dark:shadow-slate-900/50 p-4 backdrop-blur-sm">
        <div className="mb-4">
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-1">Annual Volume</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Provide an estimate of your annual volume.</p>
        </div>

        <div className="flex gap-4 items-start">
          <FormField
            control={form.control}
            name="annualVolumeType"
            render={({ field }) => (
              <div className="flex-shrink-0">
                <FormLabel className="text-sm font-medium text-slate-800 dark:text-slate-200 mb-2 block">Type</FormLabel>
                <Tabs 
                  value={field.value} 
                  onValueChange={field.onChange} 
                  className="w-40"
                >
                  <TabsList className="grid w-full grid-cols-2 bg-slate-100 dark:bg-slate-800 shadow-inner">
                    {ANNUAL_VOLUME_TYPES.map((type) => (
                      <TabsTrigger 
                        key={type.value} 
                        value={type.value}
                        className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-md rounded-md text-xs px-2"
                      >
                        {type.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              </div>
            )}
          />
          
          <FormField
            control={form.control}
            name="annualVolumeValue"
            render={({ field: volumeField }) => (
              <FormItem className="flex-1">
                <FormField
                  control={form.control}
                  name="annualVolumeType"
                  render={({ field: typeField }) => (
                    <>
                      <FormLabel className="text-sm font-medium text-slate-800 dark:text-slate-200">
                        Annual Volume ({typeField.value === 'units' ? 'Units' : 'Currency'})
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder={typeField.value === 'units' ? "e.g., 10,000" : "e.g., 500,000"}
                          value={volumeField.value || ""}
                          onChange={(e) => {
                            const value = e.target.value;
                            volumeField.onChange(
                              value === "" ? undefined : parseInt(value, 10) || undefined
                            );
                          }}
                          className="h-10 shadow-sm border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-slate-400 dark:hover:border-slate-500 transition-colors focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                      </FormControl>
                      <FormMessage className="!mt-1.5 text-xs"/>
                    </>
                  )}
                />
              </FormItem>
            )}
          />
        </div>
      </div>
    </motion.div>
  );
}; 