import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Bell, Mail, CheckCircle, Loader2 } from "lucide-react";

const subscribeSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  name: z.string().optional(),
  categories: z.array(z.string()).optional(),
});

type SubscribeFormData = z.infer<typeof subscribeSchema>;

const CATEGORIES = [
  { id: "LATEST_JOB", label: "Latest Jobs" },
  { id: "RESULT", label: "Results" },
  { id: "ADMIT_CARD", label: "Admit Cards" },
  { id: "ANSWER_KEY", label: "Answer Keys" },
  { id: "SYLLABUS", label: "Syllabus" },
  { id: "ADMISSION", label: "Admissions" },
];

export function JobAlertSubscribe() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const { toast } = useToast();

  const form = useForm<SubscribeFormData>({
    resolver: zodResolver(subscribeSchema),
    defaultValues: {
      email: "",
      name: "",
      categories: ["LATEST_JOB", "RESULT", "ADMIT_CARD"],
    },
  });

  const subscribeMutation = useMutation({
    mutationFn: async (data: SubscribeFormData) => {
      const response = await apiRequest("POST", "/api/job-alerts/subscribe", data);
      return response.json();
    },
    onSuccess: () => {
      setIsSubscribed(true);
      toast({
        title: "Subscription Successful!",
        description: "You will now receive job alerts on your email.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Subscription Failed",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SubscribeFormData) => {
    subscribeMutation.mutate(data);
  };

  if (isSubscribed) {
    return (
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-green-200 dark:border-green-800">
        <CardContent className="flex flex-col items-center justify-center py-8 gap-4">
          <CheckCircle className="h-16 w-16 text-green-500" />
          <div className="text-center">
            <h3 className="text-xl font-bold text-green-700 dark:text-green-400">Successfully Subscribed!</h3>
            <p className="text-green-600 dark:text-green-500 mt-2">
              You'll receive email alerts for new government jobs.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30 border-orange-200 dark:border-orange-800" data-testid="subscribe-card">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-500 rounded-lg">
            <Bell className="h-6 w-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-xl text-orange-800 dark:text-orange-200">
              Get Job Alerts FREE
            </CardTitle>
            <CardDescription className="text-orange-700 dark:text-orange-300">
              Receive latest govt job notifications in your inbox
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-orange-800 dark:text-orange-200">Email Address *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-orange-500" />
                      <Input
                        placeholder="your.email@example.com"
                        className="pl-10 border-orange-300 focus:border-orange-500"
                        data-testid="input-subscribe-email"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-orange-800 dark:text-orange-200">Name (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Your name"
                      className="border-orange-300 focus:border-orange-500"
                      data-testid="input-subscribe-name"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <FormLabel className="text-orange-800 dark:text-orange-200">Alert Categories</FormLabel>
              <div className="grid grid-cols-2 gap-2">
                {CATEGORIES.map((category) => (
                  <FormField
                    key={category.id}
                    control={form.control}
                    name="categories"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(category.id)}
                            onCheckedChange={(checked) => {
                              const current = field.value || [];
                              if (checked) {
                                field.onChange([...current, category.id]);
                              } else {
                                field.onChange(current.filter((c) => c !== category.id));
                              }
                            }}
                            data-testid={`checkbox-category-${category.id.toLowerCase()}`}
                          />
                        </FormControl>
                        <FormLabel className="text-sm font-normal text-orange-700 dark:text-orange-300 cursor-pointer">
                          {category.label}
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                ))}
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
              disabled={subscribeMutation.isPending}
              data-testid="button-subscribe"
            >
              {subscribeMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Subscribing...
                </>
              ) : (
                <>
                  <Bell className="mr-2 h-4 w-4" />
                  Subscribe for Free Alerts
                </>
              )}
            </Button>

            <p className="text-xs text-orange-600 dark:text-orange-400 text-center">
              No spam. Unsubscribe anytime. We respect your privacy.
            </p>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

export function JobAlertSubscribeCompact() {
  const [email, setEmail] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const { toast } = useToast();

  const subscribeMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await apiRequest("POST", "/api/job-alerts/subscribe", {
        email,
        categories: ["LATEST_JOB", "RESULT", "ADMIT_CARD", "ANSWER_KEY"],
      });
      return response.json();
    },
    onSuccess: () => {
      setIsSubscribed(true);
      toast({
        title: "Subscribed!",
        description: "You'll now receive job alerts.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  if (isSubscribed) {
    return (
      <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
        <CheckCircle className="h-5 w-5" />
        <span className="font-medium">Subscribed!</span>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <Input
        type="email"
        placeholder="Enter your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="max-w-xs border-orange-300"
        data-testid="input-compact-email"
      />
      <Button
        onClick={() => email && subscribeMutation.mutate(email)}
        disabled={!email || subscribeMutation.isPending}
        className="bg-orange-500 hover:bg-orange-600"
        data-testid="button-compact-subscribe"
      >
        {subscribeMutation.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          "Subscribe"
        )}
      </Button>
    </div>
  );
}
