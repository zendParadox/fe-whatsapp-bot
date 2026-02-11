"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, ArrowLeft, Send, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

// ... (imports)

const formSchema = z.object({
  name: z.string().optional(),
  email: z.string().email("Email tidak valid").optional().or(z.literal("")),
  type: z.enum(["SUGGESTION", "BUG", "CRITICISM", "OTHER"]),
  message: z.string().min(10, {
    message: "Pesan minimal 10 karakter.",
  }),
});

export default function FeedbackPage() {
  const router = useRouter();
  // removed useToast
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      message: "",
      type: "OTHER",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Something went wrong");
      }

      setIsSuccess(true);
      toast.success("Feedback Terkirim!", {
        description: "Terima kasih atas masukan Anda untuk pengembangan GoTEK.",
      });
      
      form.reset();
    } catch (error) {
      toast.error("Gagal Mengirim", {
        description: error instanceof Error ? error.message : "Terjadi kesalahan.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background blobs for aesthetics */}
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-neon-purple/20 rounded-full blur-[100px]" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-neon-cyan/20 rounded-full blur-[100px]" />
        </div>

        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md"
        >
          <Card className="border-green-500/20 bg-background/50 backdrop-blur-md">
            <CardContent className="pt-10 pb-10 flex flex-col items-center text-center space-y-6">
              <div className="h-20 w-20 bg-green-500/10 rounded-full flex items-center justify-center animate-pulse">
                <CheckCircle2 className="h-10 w-10 text-green-500" />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-2">Terima Kasih!</h2>
                <p className="text-muted-foreground">
                  Feedback Anda sangat berharga bagi kami. Kami akan meninjau setiap masukan yang masuk.
                </p>
              </div>
              <div className="flex gap-4 w-full">
                <Button variant="outline" className="flex-1" onClick={() => setIsSuccess(false)}>
                  Kirim Lagi
                </Button>
                <Button className="flex-1 bg-neon-cyan text-black hover:bg-neon-cyan/90" asChild>
                  <Link href="/">Kembali ke Home</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background blobs */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-neon-purple/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-neon-cyan/10 rounded-full blur-[100px]" />
      </div>

      <div className="container max-w-2xl mx-auto py-12 px-4">
        <div className="mb-8">
            <Button variant="ghost" size="sm" asChild className="gap-2 text-muted-foreground hover:text-foreground">
                <Link href="/">
                    <ArrowLeft className="h-4 w-4" /> Kembali
                </Link>
            </Button>
        </div>

        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className="text-center mb-10">
                <h1 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-neon-cyan to-neon-purple bg-clip-text text-transparent">
                    Kirim Feedback
                </h1>
                <p className="text-muted-foreground text-lg">
                    Bantu kami membuat GoTEK lebih baik. Laporkan bug, berikan saran fitur, atau sekadar menyapa!
                </p>
            </div>

            <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-xl">
                <CardHeader>
                    <CardTitle>Formulir Masukan</CardTitle>
                    <CardDescription>
                        Identitas Anda bersifat opsional jika ingin mengirim secara anonim.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-4">
                            <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Nama (Opsional)</FormLabel>
                                <FormControl>
                                    <Input placeholder="Nama Anda" {...field} className="bg-background/50" />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                            <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Email (Opsional)</FormLabel>
                                <FormControl>
                                    <Input placeholder="email@contoh.com" {...field} className="bg-background/50" />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                        </div>

                        <FormField
                        control={form.control}
                        name="type"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Tipe Feedback</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                <SelectTrigger className="bg-background/50">
                                    <SelectValue placeholder="Pilih tipe" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                <SelectItem value="SUGGESTION">💡 Saran Fitur (Suggestion)</SelectItem>
                                <SelectItem value="BUG">🐛 Lapor Bug (Bug Report)</SelectItem>
                                <SelectItem value="CRITICISM">📢 Kritik (Criticism)</SelectItem>
                                <SelectItem value="OTHER">📝 Lainnya (Other)</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                        />

                        <FormField
                        control={form.control}
                        name="message"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Pesan Anda</FormLabel>
                            <FormControl>
                                <Textarea 
                                    placeholder="Ceritakan detail masukan Anda di sini..." 
                                    className="min-h-[150px] resize-none bg-background/50"
                                    {...field} 
                                />
                            </FormControl>
                            <FormDescription>
                                Jelaskan sedetail mungkin agar kami dapat memahaminya dengan baik.
                            </FormDescription>
                            <FormMessage />
                            </FormItem>
                        )}
                        />

                        <Button 
                            type="submit" 
                            className="w-full bg-gradient-to-r from-neon-purple to-neon-pink hover:opacity-90 transition-all h-12 text-lg font-medium shadow-lg shadow-purple-500/20"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Mengirim...
                                </>
                            ) : (
                                <>
                                    <Send className="mr-2 h-5 w-5" /> Kirim Feedback
                                </>
                            )}
                        </Button>
                    </form>
                    </Form>
                </CardContent>
            </Card>
        </motion.div>
      </div>
    </div>
  );
}
