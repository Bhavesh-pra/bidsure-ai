import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "./use-auth";
import type { ApiError } from "@/types";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid official email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname;

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "officer@nhai.bidsure.test",
      password: "Officer@123",
    },
  });

  const handleQuickFill = (email: string, password: string) => {
    setValue("email", email);
    setValue("password", password);
    setErrorMessage(null);
  };

  const onSubmit = async (data: LoginFormValues) => {
    setErrorMessage(null);
    try {
      const user = await login(data);
      if (from && !from.startsWith("/auth")) {
        navigate(from, { replace: true });
      } else if (user.role === "BIDDER") {
        navigate("/bidder/dashboard", { replace: true });
      } else {
        navigate("/officer/dashboard", { replace: true });
      }
    } catch (err) {
      const apiErr = err as ApiError;
      setErrorMessage(apiErr.message || "Authentication failed. Please check your credentials.");
    }
  };

  return (
    <Card className="w-full shadow-md">
      <CardHeader>
        <CardTitle>Sign In</CardTitle>
        <CardDescription>
          Enter your credentials to access the BidSure evaluation portal
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          {errorMessage && (
            <div
              className="p-3 text-xs rounded-md bg-red-50 border border-red-200 text-red-700 font-medium"
              role="alert"
            >
              {errorMessage}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Quick-Fill Test Personas (Synthetic Demo)
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickFill("officer@nhai.bidsure.test", "Officer@123")}
                className="px-2 py-1.5 text-xs font-medium rounded border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 text-slate-700 text-left transition-colors"
              >
                🏛️ <span className="font-semibold">Procurement Officer</span>
                <span className="block text-[10px] text-slate-500 truncate">officer@nhai...</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill("bidder1@apexinfra.bidsure.test", "Bidder@123")}
                className="px-2 py-1.5 text-xs font-medium rounded border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-300 text-slate-700 text-left transition-colors"
              >
                🏢 <span className="font-semibold">Bidder (Apex)</span>
                <span className="block text-[10px] text-slate-500 truncate">bidder1@apexinfra...</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill("reviewer@nhai.bidsure.test", "Reviewer@123")}
                className="px-2 py-1.5 text-xs font-medium rounded border border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 text-slate-700 text-left transition-colors"
              >
                🔍 <span className="font-semibold">Reviewer</span>
                <span className="block text-[10px] text-slate-500 truncate">reviewer@nhai...</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill("auditor@nhai.bidsure.test", "Auditor@123")}
                className="px-2 py-1.5 text-xs font-medium rounded border border-slate-200 bg-slate-50 hover:bg-purple-50 hover:border-purple-300 text-slate-700 text-left transition-colors"
              >
                🛡️ <span className="font-semibold">Auditor</span>
                <span className="block text-[10px] text-slate-500 truncate">auditor@nhai...</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="email">
              Official Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              {...register("email")}
              className="w-full px-3 py-2 text-sm rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              {...register("password")}
              className="w-full px-3 py-2 text-sm rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {errors.password && <p className="text-xs text-red-600 mt-1">{errors.password.message}</p>}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-3">
          <Button type="submit" isLoading={isSubmitting} className="w-full">
            Sign In
          </Button>
          <p className="text-xs text-center text-slate-500">
            Need an account?{" "}
            <Link to="/auth/register" className="text-blue-600 hover:underline">
              Register here
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
};
