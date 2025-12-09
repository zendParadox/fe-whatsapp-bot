// "use client";

// import { useState, Suspense } from "react";
// import Link from "next/link";
// import { useRouter, useSearchParams } from "next/navigation";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
// import { Loader2 } from "lucide-react";
// import { toast } from "sonner";

// function ResetPasswordForm() {
//   const router = useRouter();
//   const searchParams = useSearchParams();
//   const token = searchParams.get("token");

//   const [password, setPassword] = useState("");
//   const [confirmPassword, setConfirmPassword] = useState("");
//   const [isLoading, setIsLoading] = useState(false);

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();

//     if (password !== confirmPassword) {
//       toast.error("Passwords do not match");
//       return;
//     }

//     if (!token) {
//       toast.error("Invalid token");
//       return;
//     }

//     setIsLoading(true);

//     try {
//       const res = await fetch("/api/auth/reset-password", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ token, newPassword: password }),
//       });

//       const data = await res.json();

//       if (!res.ok) {
//         throw new Error(data.error || "Something went wrong");
//       }

//       toast.success("Password reset successful", {
//         description: "You can now login with your new password.",
//       });

//       router.push("/login");
//     } catch (error: any) {
//       toast.error("Error", {
//         description: error.message,
//       });
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   if (!token) {
//     return (
//         <Card className="w-full max-w-md glass-card">
//             <CardContent className="pt-6 text-center">
//                 <p className="text-destructive mb-4">Invalid or missing reset token.</p>
//                 <Button asChild>
//                     <Link href="/forgot-password">Request New Link</Link>
//                 </Button>
//             </CardContent>
//         </Card>
//     )
//   }

//   return (
//     <Card className="w-full max-w-md glass-card">
//       <CardHeader>
//         <CardTitle className="text-2xl font-bold text-center">Reset Password</CardTitle>
//         <CardDescription className="text-center">
//           Enter your new password below.
//         </CardDescription>
//       </CardHeader>
//       <CardContent>
//         <form onSubmit={handleSubmit} className="space-y-4">
//           <div className="space-y-2">
//             <Label htmlFor="password">New Password</Label>
//             <Input
//               id="password"
//               type="password"
//               value={password}
//               onChange={(e) => setPassword(e.target.value)}
//               required
//             />
//           </div>
//           <div className="space-y-2">
//             <Label htmlFor="confirmPassword">Confirm Password</Label>
//             <Input
//               id="confirmPassword"
//               type="password"
//               value={confirmPassword}
//               onChange={(e) => setConfirmPassword(e.target.value)}
//               required
//             />
//           </div>
//           <Button type="submit" className="w-full bg-neon-purple hover:bg-neon-purple/90 text-white font-bold" disabled={isLoading}>
//             {isLoading ? (
//               <>
//                 <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                 Resetting...
//               </>
//             ) : (
//               "Reset Password"
//             )}
//           </Button>
//         </form>
//       </CardContent>
//     </Card>
//   );
// }

// export default function ResetPasswordPage() {
//     return (
//         <div className="flex min-h-screen items-center justify-center bg-background px-4">
//             <Suspense fallback={<div className="text-center text-muted-foreground">Loading...</div>}>
//                 <ResetPasswordForm />
//             </Suspense>
//         </div>
//     )
// }
