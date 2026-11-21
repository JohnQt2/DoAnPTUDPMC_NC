export interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

export interface NoticePayload {
  id: number;
  message: string;
  variant: 'error' | 'info' | 'success';
}

type ConfirmResolver = (result: boolean) => void;

export interface ConfirmRequest extends ConfirmOptions {
  id: number;
  resolve: ConfirmResolver;
}

/**
 * Replaces ugly native browser confirm() with a sleek Liquid Glass modal
 */
export function appConfirm(options: ConfirmOptions): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false);
  return new Promise<boolean>((resolve) => {
    window.dispatchEvent(
      new CustomEvent<ConfirmRequest>('hanzi-confirm', {
        detail: {
          id: Date.now() + Math.random(),
          ...options,
          resolve,
        },
      })
    );
  });
}

/**
 * Replaces ugly native browser alert() with a sleek Liquid Glass banner
 */
export function appNotice(message: string, variant: 'error' | 'info' | 'success' = 'error') {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent<NoticePayload>('hanzi-notice', {
      detail: {
        id: Date.now() + Math.random(),
        message,
        variant,
      },
    })
  );
}
