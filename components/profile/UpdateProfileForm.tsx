"use client"
import { useState, ChangeEvent, FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "../ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useUser } from "@/lib/stores/user"
import { X } from "lucide-react"

// Define TypeScript interfaces
interface IndustrySubcategory {
  name: string;
  subcategories: string[];
}

interface IndustryCategories {
  [key: string]: IndustrySubcategory;
}

interface OrganizationProfile {
  organization_name?: string;
  location?: string;
  employee_count?: string | number;
  industry_category?: string;
  industry_subcategory?: string;
  description?: string;
}

interface UpdateProfileFormProps {
  isOpen: boolean;
  onClose: () => void;
  currentProfile?: OrganizationProfile;
  mandatory?: boolean; // Add mandatory prop
}

// Industry categories with subcategories
const industryCategories: IndustryCategories = {
  manufacturing: {
    name: "Manufacturing",
    subcategories: ["Automotive", "Electronics", "Food & Beverage", "Pharmaceuticals", "Textiles"]
  },
  technology: {
    name: "Technology",
    subcategories: ["Software", "Hardware", "IT Services", "Telecommunications", "Biotechnology"]
  },
  healthcare: {
    name: "Healthcare",
    subcategories: ["Hospitals", "Medical Devices", "Pharmaceuticals", "Health Insurance", "Telehealth"]
  },
  retail: {
    name: "Retail",
    subcategories: ["E-commerce", "Apparel", "Grocery", "Electronics", "Home Goods"]
  },
  finance: {
    name: "Finance",
    subcategories: ["Banking", "Insurance", "Investment", "Fintech", "Real Estate"]
  }
}

export function UpdateProfileForm({ isOpen, onClose, currentProfile = {}, mandatory = false }: UpdateProfileFormProps) {
  const [category, setCategory] = useState<string>(currentProfile.industry_category || "")
  const [formData, setFormData] = useState<OrganizationProfile>({
    organization_name: currentProfile.organization_name || "",
    location: currentProfile.location || "",
    employee_count: currentProfile.employee_count || "",
    industry_category: currentProfile.industry_category || "",
    industry_subcategory: currentProfile.industry_subcategory || "",
    description: currentProfile.description || ""
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { userData, updateUserData } = useUser();

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleCategoryChange = (value: string) => {
    setCategory(value)
    setFormData(prev => ({
      ...prev,
      industry_category: value,
      industry_subcategory: "" // Reset subcategory when category changes
    }))
  }

  const handleSubcategoryChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      industry_subcategory: value
    }))
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const updatedData = {
        id: userData?.id, // Assuming userData has the user's ID
        organisation_name: formData.organization_name, // Notice the spelling difference
        location: formData.location,
        employee_count: Number(formData.employee_count),
        industry: formData.industry_category,
        sub_industry: formData.industry_subcategory,
        description: formData.description
      };

      console.log("Submitting organization profile:", updatedData);
      await updateUserData(updatedData);
      
      // If mandatory, redirect to clean URL after successful update
      if (mandatory) {
        window.location.href = '/profile';
      } else {
        onClose();
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      // Handle error (you might want to show an error message to the user)
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleClose = () => {
    if (!mandatory) {
      onClose();
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={mandatory ? undefined : onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold">
              {mandatory ? "Complete Your Profile" : "Update Organization Profile"}
            </DialogTitle>
            {!mandatory && (
              <Button variant="ghost" size="sm" onClick={handleClose} className="h-8 w-8 p-0">
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          {mandatory && (
            <p className="text-sm text-muted-foreground mt-2">
              Please complete your organization profile to continue using the platform.
            </p>
          )}
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="organization_name">Organization Name</Label>
              <Input
                id="organization_name"
                name="organization_name"
                value={formData.organization_name}
                onChange={handleChange}
                placeholder="ACME Corporation"
                className="shadow-md"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="City, Country"
                className="shadow-md"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="employee_count">Employee Count</Label>
              <Input
                id="employee_count"
                name="employee_count"
                type="number"
                value={formData.employee_count}
                onChange={handleChange}
                placeholder="100"
                className="shadow-md"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="industry_category">Industry Category</Label>
              <Select
                value={formData.industry_category?.toString()}
                onValueChange={handleCategoryChange}
              >
                <SelectTrigger id="industry_category" className="shadow-md">
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(industryCategories).map((key) => (
                    <SelectItem key={key} value={key}>
                      {industryCategories[key].name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="industry_subcategory">Industry Subcategory</Label>
              <Select
                value={formData.industry_subcategory?.toString()}
                onValueChange={handleSubcategoryChange}
                disabled={!category}
              >
                <SelectTrigger id="industry_subcategory" className="shadow-md">
                  <SelectValue placeholder="Select Subcategory" />
                </SelectTrigger>
                <SelectContent>
                  {category && industryCategories[category]?.subcategories.map((subcat) => (
                    <SelectItem key={subcat} value={subcat}>
                      {subcat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Company Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Brief description of your organization"
              className="h-32 shadow-md"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}