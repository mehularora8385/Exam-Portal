import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Bell, BellOff, Loader2, CheckCircle } from "lucide-react";

export function PushNotificationButton() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    checkPushSupport();
  }, []);

  const checkPushSupport = async () => {
    setIsLoading(true);
    try {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        setIsSupported(false);
        setIsLoading(false);
        return;
      }

      setIsSupported(true);

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (error) {
      console.error("Error checking push support:", error);
      setIsSupported(false);
    } finally {
      setIsLoading(false);
    }
  };

  const subscribeMutation = useMutation({
    mutationFn: async () => {
      const registration = await navigator.serviceWorker.ready;
      
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        throw new Error("Notification permission denied");
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          "BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U"
        ),
      });

      const subscriptionJson = subscription.toJSON();
      
      const response = await apiRequest("POST", "/api/job-alerts/push-subscribe", {
        endpoint: subscriptionJson.endpoint,
        keys: subscriptionJson.keys,
        userAgent: navigator.userAgent,
        categories: ["LATEST_JOB", "RESULT", "ADMIT_CARD"],
      });
      
      return response.json();
    },
    onSuccess: () => {
      setIsSubscribed(true);
      toast({
        title: "Notifications Enabled!",
        description: "You'll receive alerts for new government jobs.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Enable",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const unsubscribeMutation = useMutation({
    mutationFn: async () => {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
      }
    },
    onSuccess: () => {
      setIsSubscribed(false);
      toast({
        title: "Notifications Disabled",
        description: "You won't receive push alerts anymore.",
      });
    },
  });

  if (!isSupported) {
    return null;
  }

  if (isLoading) {
    return (
      <Button variant="outline" size="sm" disabled>
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        Checking...
      </Button>
    );
  }

  if (isSubscribed) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => unsubscribeMutation.mutate()}
        disabled={unsubscribeMutation.isPending}
        className="text-green-600 border-green-300"
        data-testid="button-push-unsubscribe"
      >
        <CheckCircle className="h-4 w-4 mr-2" />
        Notifications On
      </Button>
    );
  }

  return (
    <Button
      variant="default"
      size="sm"
      onClick={() => subscribeMutation.mutate()}
      disabled={subscribeMutation.isPending}
      className="bg-orange-500 hover:bg-orange-600"
      data-testid="button-push-subscribe"
    >
      {subscribeMutation.isPending ? (
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
      ) : (
        <Bell className="h-4 w-4 mr-2" />
      )}
      Enable Alerts
    </Button>
  );
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
