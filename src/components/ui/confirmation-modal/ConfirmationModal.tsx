import React from 'react';
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  HelpCircle 
} from 'lucide-react';
import './ConfirmationModal.css';
import { Button } from '@/components/ui/button';

export type ModalType = 'warning' | 'success' | 'error' | 'info';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  type?: ModalType;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = 'warning',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isLoading = false
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="modal-icon warning" />;
      case 'success':
        return <CheckCircle className="modal-icon success" />;
      case 'error':
        return <XCircle className="modal-icon error" />;
      case 'info':
        return <HelpCircle className="modal-icon info" />;
      default:
        return <AlertTriangle className="modal-icon warning" />;
    }
  };

  const getConfirmButtonClass = () => {
    switch (type) {
      case 'warning':
        return 'confirm-warning';
      case 'success':
        return 'confirm-success';
      case 'error':
        return 'confirm-error';
      case 'info':
        return 'confirm-info';
      default:
        return 'confirm-warning';
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal-container">
        <div className="modal-header">
          {getIcon()}
          <h2 className="modal-title">{title}</h2>
        </div>
        <div className="modal-body">
          <p className="modal-message">{message}</p>
        </div>
        <div className="modal-footer">
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={isLoading}
            className="cancel-button"
          >
            {cancelText}
          </Button>
          <Button 
            onClick={onConfirm}
            isLoading={isLoading}
            className={getConfirmButtonClass()}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}