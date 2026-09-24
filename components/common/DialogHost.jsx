'use client';

import useDialogStore from '@/stores/useDialogStore';
import ConfirmModal from '@/components/common/ConfirmModal';
import AlertModal from '@/components/common/AlertModal';

// confirmDialog / alertDialog 가 띄우는 창을 실제로 그리는 곳. 레이아웃에 한 번만 둔다.
export default function DialogHost() {
  const dialog = useDialogStore((s) => s.dialog);
  const close = useDialogStore((s) => s.close);

  const finish = (value) => {
    dialog?.resolve?.(value);
    close();
  };

  if (!dialog) return null;

  if (dialog.type === 'confirm') {
    return (
      <ConfirmModal
        open
        title={dialog.title}
        confirmText={dialog.confirmText}
        cancelText={dialog.cancelText}
        onConfirm={() => finish(true)}
        onCancel={() => finish(false)}
      />
    );
  }

  return (
    <AlertModal
      open
      title={dialog.title}
      description={dialog.description}
      onClose={() => finish(undefined)}
    />
  );
}
