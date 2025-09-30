
import React from 'react';
import Button from './Button';

interface ConfirmationDialogProps {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  confirmVariant?: 'primary' | 'secondary' | 'danger';
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  confirmVariant = 'primary',
}) => {
  return (
    <div className="p-6">
      <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">{title}</h3>
      <p className="mt-2 text-slate-600 dark:text-slate-400">{message}</p>
      <div className="mt-6 flex justify-end gap-4">
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant={confirmVariant} onClick={onConfirm}>
          {confirmText}
        </Button>
      </div>
    </div>
  );
};

export default ConfirmationDialog;