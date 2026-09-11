"use client";

import { useEffect, useState } from "react";
import { Bell, Check, ShoppingCart } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { ThemeToggle } from "@/components/theme-toggle";
import { useCart } from "@/components/CartContext";

type DashboardNotification = {
  id: string;
  title: string;
  content: string;
  created_at: string;
  read: boolean;
};

export function DashboardHeaderActions({ showCart = false }: { showCart?: boolean }) {
  const { items, setIsCartOpen } = useCart();
  const [notifications, setNotifications] = useState<DashboardNotification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    let active = true;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const loadNotifications = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!active || !session?.user?.id) return;

      const userId = session.user.id;
      const fetchNotifications = async () => {
        const { data, error } = await supabase
          .from("notifications")
          .select("*")
          .or(`user_id.is.null,user_id.eq.${userId}`)
          .eq("read", false)
          .order("created_at", { ascending: false });

        if (active && !error && data) {
          setNotifications(data as DashboardNotification[]);
        }
      };

      await fetchNotifications();
      if (!active) return;

      // DashboardHeaderActions can be rendered in the mobile header, sidebar and
      // page header at the same time. Each instance needs its own channel topic;
      // Supabase reuses channels with the same topic and rejects handlers added
      // after the first instance has already subscribed.
      const channelInstanceId = crypto.randomUUID();
      channel = supabase
        .channel(`dashboard-header-notifications-${userId}-${channelInstanceId}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, fetchNotifications)
        .subscribe();
    };

    loadNotifications();

    return () => {
      active = false;
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  const markAsRead = async (id: string) => {
    const { error } = await supabase.from("notifications").update({ read: true }).eq("id", id);
    if (!error) {
      setNotifications((current) => {
        const next = current.filter((item) => item.id !== id);
        if (next.length === 0) setShowNotifications(false);
        return next;
      });
    }
  };

  const hasUnread = notifications.some((notification) => !notification.read);

  return (
    <div className="relative flex items-center gap-1.5 rounded-2xl bg-surface/80 p-1.5 shadow-[0_10px_35px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:shadow-black/20">
      <ThemeToggle className="h-10 w-10" />

      <button
        type="button"
        onClick={() => setShowNotifications((current) => !current)}
        aria-label="Abrir notificações"
        aria-expanded={showNotifications}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl text-foreground/55 transition-colors hover:bg-foreground/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <Bell className="h-[18px] w-[18px]" />
        {hasUnread ? <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-accent ring-2 ring-surface" /> : null}
      </button>

      {showCart ? (
        <button
          type="button"
          onClick={() => setIsCartOpen(true)}
          aria-label={`Abrir carrinho com ${items.length} ${items.length === 1 ? "item" : "itens"}`}
          className="relative flex h-10 items-center justify-center gap-2 rounded-xl bg-accent px-3.5 text-white shadow-lg shadow-accent/20 transition-all hover:-translate-y-0.5 hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <ShoppingCart className="h-[18px] w-[18px]" />
          <span className="hidden text-xs font-black sm:inline">Carrinho</span>
          {items.length > 0 ? (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[10px] font-black text-accent">
              {items.length > 99 ? "99+" : items.length}
            </span>
          ) : null}
        </button>
      ) : null}

      {showNotifications ? (
        <div className="absolute right-0 top-[calc(100%+0.65rem)] z-[100] w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-3xl bg-surface p-2 shadow-2xl ring-1 ring-foreground/10">
          <div className="flex items-center justify-between px-3 pb-2 pt-2">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-accent">Central</p>
              <h2 className="text-sm font-black text-foreground">Notificações</h2>
            </div>
            <span className="rounded-full bg-foreground/5 px-2 py-1 text-[10px] font-bold text-foreground/45">
              {notifications.length}
            </span>
          </div>

          <div className="custom-scrollbar flex max-h-72 flex-col gap-1 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="rounded-2xl bg-background/70 px-4 py-8 text-center text-xs font-medium text-foreground/45">
                Nenhum alerta ativo por enquanto.
              </p>
            ) : notifications.map((notification) => (
              <div
                key={notification.id}
                className={`rounded-2xl p-3 transition-colors ${notification.read ? "bg-transparent opacity-60" : "bg-accent/8"}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className={`truncate text-xs font-bold ${notification.read ? "text-foreground" : "text-accent"}`}>
                      {notification.title}
                    </p>
                    <p className="mt-1 text-[11px] leading-relaxed text-foreground/55">{notification.content}</p>
                  </div>
                  {!notification.read ? (
                    <button
                      type="button"
                      onClick={() => markAsRead(notification.id)}
                      aria-label={`Dispensar notificação: ${notification.title}`}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-emerald-500 transition-colors hover:bg-emerald-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>
                <time className="mt-2 block text-[9px] font-medium text-foreground/30">
                  {new Date(notification.created_at).toLocaleString("pt-BR")}
                </time>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
