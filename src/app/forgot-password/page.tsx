// "use client";

// import { useState } from "react";
// import Link from "next/link";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
// import { ArrowLeft, Loader2 } from "lucide-react";
// import { toast } from "sonner";

// export default function ForgotPasswordPage() {
//   const [email, setEmail] = useState("");
//   const [isLoading, setIsLoading] = useState(false);
//   const [isSubmitted, setIsSubmitted] = useState(false);

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setIsLoading(true);

//     try {
//       const res = await fetch("/api/auth/forgot-password", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ email }),
//       });

//       const data = await res.json();

//       if (!res.ok) {
//         throw new Error(data.error || "Something went wrong");
//       }

//       setIsSubmitted(true);
//       toast.success("Success", {
//         description: data.message,
//       });
//     } catch (error: any) {
//       toast.error("Error", {
//         description: error.message,
//       });
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <div className="flex min-h-screen items-center justify-center bg-background px-4">
//       <Card className="w-full max-w-md glass-card">
//         <CardHeader>
//           <CardTitle className="text-2xl font-bold text-center">Forgot Password</CardTitle>
//           <CardDescription className="text-center">
//             Enter your email address and we'll send you a link to reset your password.
//           </CardDescription>
//         </CardHeader>
//         <CardContent>
//           {isSubmitted ? (
//             <div className="text-center space-y-4">
//               <div className="p-4 bg-green-500/10 text-green-500 rounded-lg border border-green-500/20">
//                 <p>Check your email (or server console) for the reset link.</p>
//               </div>
//               <Button asChild variant="outline" className="w-full">
//                 <Link href="/login">Back to Login</Link>
//               </Button>
//             </div>
//           ) : (
//             <form onSubmit={handleSubmit} className="space-y-4">
//               <div className="space-y-2">
//                 <Label htmlFor="email">Email</Label>
//                 <Input
//                   id="email"
//                   type="email"
//                   placeholder="name@example.com"
//                   value={email}
//                   onChange={(e) => setEmail(e.target.value)}
//                   required
//                 />
//               </div>
//               <Button type="submit" className="w-full bg-neon-cyan hover:bg-neon-cyan/90 text-black font-bold" disabled={isLoading}>
//                 {isLoading ? (
//                   <>
//                     <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                     Sending...
//                   </>
//                 ) : (
//                   "Send Reset Link"
//                 )}
//               </Button>
//             </form>
//           )}
//         </CardContent>
//         <CardFooter className="flex justify-center">
//           <Link href="/login" className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
//             <ArrowLeft className="mr-2 h-4 w-4" />
//             Back to Login
//           </Link>
//         </CardFooter>
//       </Card>
//     </div>
//   );
// }
