"use client"

import { useFormContext } from "react-hook-form";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { CountryDropdown } from "@/components/ui/country-dropdown";
import { FormData } from "./form-schema";

interface CountrySelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onContinue: () => void;
}

export const CountrySelectionDialog = ({
  open,
  onOpenChange,
  onContinue,
}: CountrySelectionDialogProps) => {
  const form = useFormContext<FormData>();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          <DialogHeader>
            <DialogTitle>Select Your Country</DialogTitle>
            <DialogDescription>
              Since you selected domestic operations, please specify your
              country.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <FormField
              control={form.control}
              name="country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Country</FormLabel>
                  <CountryDropdown
                    onChange={(country) => field.onChange(country.alpha3)}
                    defaultValue={field.value}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <DialogFooter>
            <Button onClick={() => onOpenChange(false)} variant="outline">
              Cancel
            </Button>
            <Button onClick={onContinue}>Continue</Button>
          </DialogFooter>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}; 