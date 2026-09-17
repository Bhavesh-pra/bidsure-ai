import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid official email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["OFFICER", "BIDDER"]),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "officer@gem.gov.in",
      password: "password123",
      role: "OFFICER",
    },
  });

  const selectedRole = watch("role");

  const onSubmit = async (data: LoginFormValues) => {
    // In Phase 4, authentication API will be wired here
    if (data.role === "OFFICER") {
      navigate("/officer/dashboard");
    } else {
      navigate("/bidder/dashboard");
    }
  };

  return (
    <Card className="w-full shadow-md">
      <CardHeader>
        <CardTitle>Sign In</CardTitle>
        <CardDescription>Enter your credentials to access the BidSure evaluation portal</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="role">
              Access Role
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setValue("role", "OFFICER");
                  setValue("email", "officer@gem.gov.in");
                }}
                className={`py-2 text-xs font-medium rounded-md border transition-colors ${
                  selectedRole === "OFFICER"
                    ? "bg-blue-50 border-blue-500 text-blue-700 font-semibold"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                Procurement Officer
              </button>
              <button
                type="button"
                onClick={() => {
                  setValue("role", "BIDDER");
                  setValue("email", "bidder@vendor.com");
                }}
                className={`py-2 text-xs font-medium rounded-md border transition-colors ${
                  selectedRole === "BIDDER"
                    ? "bg-indigo-50 border-indigo-500 text-indigo-700 font-semibold"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                Vendor / Bidder
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
              {...register("password")}
              className="w-full px-3 py-2 text-sm rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {errors.password && <p className="text-xs text-red-600 mt-1">{errors.password.message}</p>}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button type="submit" isLoading={isSubmitting} className="w-full">
            Sign In to {selectedRole === "OFFICER" ? "Officer Console" : "Bidder Portal"}
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
