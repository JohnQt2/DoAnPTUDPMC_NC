import { api } from './api';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    return null;
  }
  try {
    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    return reg;
  } catch (err) {
    console.warn('[PushNotification] Service worker registration failed:', err);
    return null;
  }
}

export async function requestPushSubscription(): Promise<{
  success: boolean;
  permission: NotificationPermission;
  error?: string;
}> {
  if (!('Notification' in window)) {
    return { success: false, permission: 'denied', error: 'Trình duyệt không hỗ trợ Web Notification.' };
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    return {
      success: false,
      permission,
      error:
        permission === 'denied'
          ? 'Quyền thông báo đã bị chặn. Vui lòng nhấn vào biểu tượng ổ khóa/cài đặt trên thanh địa chỉ trình duyệt để Bật lại thông báo.'
          : 'Bạn chưa cấp quyền nhận thông báo.',
    };
  }

  const reg = await registerServiceWorker();
  if (!reg) {
    return { success: true, permission: 'granted' };
  }

  try {
    // Lấy VAPID public key từ backend
    const res = await api.get<any>('/users/push/vapid-public-key');
    const vapidKey = (res?.publicKey || res?.data?.publicKey) as string | undefined;

    if (vapidKey && 'pushManager' in reg) {
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey) as unknown as BufferSource,
        });
      }

      const subJson = sub.toJSON();
      if (subJson.endpoint && subJson.keys?.p256dh && subJson.keys?.auth) {
        await api.post('/users/push/subscribe', {
          endpoint: subJson.endpoint,
          keys: {
            p256dh: subJson.keys.p256dh,
            auth: subJson.keys.auth,
          },
          userAgent: navigator.userAgent,
        });
      }
    }

    return { success: true, permission: 'granted' };
  } catch (err: any) {
    console.warn('[PushNotification] Error subscribing to Web Push, falling back to local Notification API:', err);
    return { success: true, permission: 'granted' };
  }
}

export async function unsubscribeWebPush(): Promise<boolean> {
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await sub.unsubscribe();
        await api.delete('/users/push/unsubscribe').catch(() => null);
      }
      return true;
    } catch {
      return false;
    }
  }
  return true;
}

/**
 * Fallback Client-side Watcher: Kiểm tra và kích hoạt thông báo khi tab web đang mở
 * Đảm bảo 5 mốc -15, -5, 0, +5, +15 luôn hoạt động kể cả khi chạy ở môi trường local
 */
let watcherInterval: any = null;

export function startClientReminderWatcher(
  reminderTimeStr: string,
  isEnabled: boolean,
  hasStudiedToday: boolean = false
) {
  if (watcherInterval) {
    clearInterval(watcherInterval);
    watcherInterval = null;
  }

  if (!isEnabled || !reminderTimeStr || typeof window === 'undefined' || !('Notification' in window)) {
    return;
  }

  const checkReminders = () => {
    if (Notification.permission !== 'granted') return;

    const now = new Date();
    // Giờ Việt Nam
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const parts = formatter.formatToParts(now);
    const p: Record<string, string> = {};
    parts.forEach((item) => {
      p[item.type] = item.value;
    });

    const todayStr = `${p.year}-${p.month}-${p.day}`;
    const curMins = parseInt(p.hour, 10) * 60 + parseInt(p.minute, 10);

    const match = reminderTimeStr.match(/^([01]\d|2[0-3]):([0-5]\d)$/);
    if (!match) return;
    const targetMins = parseInt(match[1], 10) * 60 + parseInt(match[2], 10);

    const diff = curMins - targetMins;
    const offsets = [-15, -5, 0, 5, 15];

    if (!offsets.includes(diff)) return;

    // Nếu là nhắc trễ (+5, +15) và học viên đã học hôm nay -> Hủy
    if ((diff === 5 || diff === 15) && hasStudiedToday) return;

    const storageKey = `client_reminder_${todayStr}_${diff}`;
    if (sessionStorage.getItem(storageKey) || localStorage.getItem(storageKey)) {
      return; // Đã gửi trong ngày
    }

    let title = `Hanzi4U: Nhắc lịch học (${reminderTimeStr})`;
    let body = 'Đã đến giờ học tiếng Trung theo kế hoạch của bạn!';

    if (diff === -15) {
      title = `⏰ Còn 15 phút nữa đến giờ học tiếng Trung (${reminderTimeStr})`;
      body = 'Chuẩn bị bài học nào! Buổi học sẽ bắt đầu sau 15 phút nữa.';
    } else if (diff === -5) {
      title = `🔔 Còn 5 phút nữa đến giờ học tiếng Trung (${reminderTimeStr})`;
      body = 'Chỉ còn 5 phút nữa! Vào học ngay để duy trì chuỗi học tập.';
    } else if (diff === 0) {
      title = `🎯 Đến giờ học tiếng Trung rồi (${reminderTimeStr})!`;
      body = 'Đã đúng giờ học hôm nay. Bắt đầu làm bài học mới ngay nào!';
    } else if (diff === 5) {
      title = `⚠️ Bạn đã trễ 5 phút so với lịch học ${reminderTimeStr} hôm nay!`;
      body = 'Hôm nay bạn chưa vào học. Chỉ 15 phút để duy trì streak nhé!';
    } else if (diff === 15) {
      title = `🚨 Bạn đã trễ 15 phút so với lịch học ${reminderTimeStr} hôm nay!`;
      body = 'Đừng để đứt chuỗi học tập! Hãy vào học một bài ngắn ngay nào.';
    }

    try {
      const notif = new Notification(title, {
        body,
        icon: '/images/logo.png',
        tag: storageKey,
      });
      notif.onclick = () => {
        window.focus();
        window.location.hash = '#/today';
      };
      sessionStorage.setItem(storageKey, '1');
      localStorage.setItem(storageKey, '1');
    } catch {
      // Ignore
    }
  };

  // Kiểm tra ngay và lặp lại mỗi 30s
  checkReminders();
  watcherInterval = setInterval(checkReminders, 30000);
}
