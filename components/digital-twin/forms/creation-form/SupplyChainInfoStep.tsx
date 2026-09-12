"use client"

import { useFormContext } from "react-hook-form";
import { motion } from "framer-motion";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { MultiSelect } from "@/components/ui/multiselect";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { InfoIcon } from "lucide-react";
import {
  INDUSTRIES,
  PRODUCT_CHARACTERISTICS,
  SUPPLIER_TIERS,
  OPERATIONS_LOCATIONS,
  SUPPLIER_TIER_INFO,
} from "@/constants/supply-chain-form";
import { FormData } from "./form-schema";

export const SupplyChainInfoStep = () => {
  const form = useFormContext<FormData>();
  const watchIndustry = form.watch("industry");

  return (
    <motion.div
      key="step-0"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <div className="space-y-6">
          <FormField
            control={form.control}
            name="industry"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Industry</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select an industry" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {INDUSTRIES.map((industry) => (
                      <SelectItem key={industry.value} value={industry.value}>
                        {industry.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          {watchIndustry === "Other" && (
            <FormField
              control={form.control}
              name="customIndustry"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Please Specify</FormLabel>
                  <FormControl>
                    <Input placeholder="Your custom industry" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>
        <div className="space-y-6">
          <FormField
            control={form.control}
            name="productCharacteristics"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Product Characteristics</FormLabel>
                <MultiSelect
                  options={PRODUCT_CHARACTERISTICS}
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  placeholder="Select characteristics..."
                />
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <FormField
          control={form.control}
          name="supplierTiers"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center gap-2">
                <FormLabel>Supplier Tiers</FormLabel>
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
                  </HoverCardTrigger>
                  <HoverCardContent
                    className="w-80 p-4"
                    side="top"
                    align="start"
                    sideOffset={5}
                  >
                    <div className="space-y-2">
                      <p className="font-medium">{SUPPLIER_TIER_INFO.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {SUPPLIER_TIER_INFO.description}
                      </p>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {SUPPLIER_TIER_INFO.tiers.map((tier, index) => (
                          <li key={index}>
                            <strong>{tier.level}</strong> {tier.description}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </HoverCardContent>
                </HoverCard>
              </div>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select supplier tiers" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {SUPPLIER_TIERS.map((tier) => (
                    <SelectItem key={tier.value} value={tier.value}>
                      {tier.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="operationsLocation"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Operations Location</FormLabel>
              <MultiSelect
                options={OPERATIONS_LOCATIONS}
                onValueChange={field.onChange}
                defaultValue={field.value}
                placeholder="Select locations..."
              />
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </motion.div>
  );
}; 