"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Github, Mail } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import {  loginWithEmailPassword ,signupWithEmailPassword, loginWithProvider, sendMagicLink } from "@/lib/functions/auth";
import { adminSignup } from "@/lib/actions/auth";
import { toast } from "sonner";
import { AuthHeader } from "./auth-header";

const authSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  password: z.string().min(8, {
    message: "Password must be at least 8 characters.",
  }),
});

type FormData = z.infer<typeof authSchema>;

const SigninPage = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [authMethod, setAuthMethod] = useState<string>("email");
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const router = useRouter();

  const form = useForm<FormData>({
    resolver: zodResolver(authSchema),
    defaultValues: {
      email: "test@example.com",
      password: "Password123!",
    },
  });

  async function onSubmit(values: FormData) {
    setIsLoading(true);
    
    try {
      let result;
      if (isSignUpMode) {
        // Use adminSignup to bypass rate limits and auto-confirm
        const adminResult = await adminSignup(values.email, values.password);
        
        if (adminResult.user) {
          // Signup succeeded, now sign in to get the session
          result = await loginWithEmailPassword(values.email, values.password);
          if (result && result.session) {
            toast.success("Account created! Welcome to the platform.");
            router.push("/dashboard");
          } else {
            toast.success("Account created! Please sign in with your credentials.");
            setIsSignUpMode(false);
          }
        } else {
          toast.error(adminResult.error || "Signup failed. Email might already be in use.");
        }
      } else {
        result = await loginWithEmailPassword(values.email, values.password);
        if (result && result.session) {
          toast.success("Welcome back! You have been signed in successfully.");
          router.push("/dashboard");
        } else if (result === null) {
          toast.error("Login failed. Please double-check your email and password.");
        } else {
          toast.error("Login failed. Please check your credentials.");
        }
      }
    } catch (error: any) {
      const msg = error?.message || "An unexpected error occurred. Please try again.";
      if (msg.includes("Email not confirmed")) {
        toast.error("Please confirm your email address before signing in. Check your inbox.");
      } else {
        toast.error(msg);
      }
      console.error(`${isSignUpMode ? 'Signup' : 'Signin'} error:`, error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSocialLogin(provider: "google" | "github") {
    setIsLoading(true);
    try {
      const result = await loginWithProvider(provider);
      if (result) {
        toast.success(`Successfully signed in with ${provider}.`);
        router.push("/dashboard");
      } else {
        toast.error(`Could not sign in with ${provider}. Please try again.`);
      }
    } catch (error) {
      toast.error(`Failed to sign in with ${provider}.`);
      console.error(`${provider} login error:`, error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleMagicLink() {
    const email = form.getValues("email");
    if (!email) {
      form.setError("email", {
        type: "manual",
        message: "Email is required for magic link",
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await sendMagicLink(email);
      if (result) {
        toast.success(`Magic link sent! Check your inbox at ${email}.`);
      } else {
        toast.error("Failed to send magic link. Please try again or use a different method.");
      }
    } catch (error) {
      toast.error("Failed to send magic link. Please try again.");
      console.error("Magic link error:", error);
    } finally {
      setIsLoading(false);
    }
  }

  const toggleMode = () => {
    setIsSignUpMode(!isSignUpMode);
    form.reset();
  };

  return (
    <>
      <AuthHeader />
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-theme-bg-primary px-4 pt-16">
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(ellipse_70%_55%_at_50%_-8%,rgba(39,72,232,0.12),transparent_65%)]" />
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(11,11,15,0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgba(11,11,15,0.035)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_55%_55%_at_50%_45%,#000_30%,transparent_75%)]" />
        <div className="relative w-full max-w-[880px] grid gap-8 lg:grid-cols-[1fr_400px] items-center">
        <div className="hidden lg:block">
          <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-theme-blue">SupplyChain AI</div>
          <h1 className="mt-3 font-display text-[2.6rem] font-semibold leading-[1.05] tracking-[-0.025em] text-theme-text-primary">Your supply chain, watched 24/7.</h1>
          <p className="mt-4 max-w-[40ch] text-[15px] leading-relaxed text-theme-text-secondary">Sign in to see your twins, the Decision Inbox and what the agent has done while you were away.</p>
          <ul className="mt-6 space-y-2 text-sm text-theme-text-secondary">
            <li>· Sentinel scans every 15 minutes</li><li>· Exact reroutes, one decision card</li><li>· Every agent run traced and auditable</li>
          </ul>
        </div>

      <Card className="w-full max-w-[400px] justify-self-center rounded-theme-lg border-theme-border-subtle bg-theme-bg-surface/90 shadow-[0_30px_80px_-40px_rgba(11,11,15,0.4)] backdrop-blur">
        <CardHeader>
          <CardTitle className="font-display text-2xl text-center text-theme-text-primary">
            {isSignUpMode ? 'Create Account' : 'Welcome Back'}
          </CardTitle>
          <CardDescription className="text-center">
            {isSignUpMode 
              ? 'Join our resilience planning platform' 
              : 'Choose your preferred method to sign in'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="email" onValueChange={setAuthMethod}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="email">Email</TabsTrigger>
              <TabsTrigger value="social">Social</TabsTrigger>
              <TabsTrigger value="magic">Magic Link</TabsTrigger>
            </TabsList>
            
            <TabsContent value="email">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="you@example.com"
                            className="bg-white/50 dark:bg-slate-800/50 border border-white/30 dark:border-slate-700"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="••••••••"
                            className="bg-white/50 dark:bg-slate-800/50 border border-white/30 dark:border-slate-700"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button 
                    type="submit" 
                    className="w-full rounded-full bg-theme-blue text-white hover:opacity-90" 
                    disabled={isLoading}
                  >
                    {isLoading 
                      ? (isSignUpMode ? "Creating Account..." : "Signing in...") 
                      : (isSignUpMode ? "Create Account" : "Sign in")
                    }
                  </Button>
                </form>
              </Form>
              
              <div className="text-center mt-4">
                <button
                  onClick={toggleMode}
                  className="text-blue-500 hover:underline text-sm focus:outline-none"
                  disabled={isLoading}
                >
                  {isSignUpMode 
                    ? 'Already have an account? Sign In' 
                    : 'Don\'t have an account? Sign Up'
                  }
                </button>
              </div>
            </TabsContent>
            
            <TabsContent value="social">
              <div className="space-y-4">
                <Button
                  variant="outline"
                  className="w-full bg-white/50 dark:bg-slate-800/50 border border-white/30 dark:border-slate-700"
                  onClick={() => handleSocialLogin("google")}
                  disabled={isLoading}
                >
                  <FcGoogle className="mr-2 h-4 w-4" />
                  Continue with Google
                </Button>
                <Button
                  variant="outline"
                  className="w-full bg-white/50 dark:bg-slate-800/50 border border-white/30 dark:border-slate-700"
                  onClick={() => handleSocialLogin("github")}
                  disabled={isLoading}
                >
                  <Github className="mr-2 h-4 w-4" />
                  Continue with GitHub
                </Button>
                <Separator />
                <p className="text-center text-sm text-muted-foreground">
                  Secure authentication with OAuth
                </p>
              </div>
            </TabsContent>
            
            <TabsContent value="magic">
              <Form {...form}>
                <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="you@example.com"
                            className="bg-white/50 dark:bg-slate-800/50 border border-white/30 dark:border-slate-700"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="button"
                    className="w-full rounded-full bg-theme-blue text-white hover:opacity-90"
                    onClick={handleMagicLink}
                    disabled={isLoading}
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    {isLoading ? "Sending..." : "Send Magic Link"}
                  </Button>
                </form>
              </Form>
              <p className="text-center text-sm text-muted-foreground mt-4">
                We'll send you a secure link to sign in instantly
              </p>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
        </div>
      </div>
    </>
  );
};

export default SigninPage;