import React, { createContext, useContext, useState, ReactNode } from 'react';
import { AlertCircle, CheckCircle2, HelpCircle, X } from 'lucide-react';

type DialogType = 'alert' | 'confirm' | 'prompt';

interface DialogOptions {
  title?: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  defaultValue?: string; // For prompt
  confirmText?: string;
  cancelText?: string;
}

interface DialogContextProps {
  showAlert: (message: string, type?: 'success' | 'error' | 'warning' | 'info', title?: string) => Promise<void>;
  showConfirm: (message: string, title?: string) => Promise<boolean>;
  showPrompt: (message: string, defaultValue?: string, title?: string) => Promise<string | null>;
}

const DialogContext = createContext<DialogContextProps | undefined>(undefined);

export function DialogProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [dialogType, setDialogType] = useState<DialogType>('alert');
  const [options, setOptions] = useState<DialogOptions>({ message: '' });
  const [inputValue, setInputValue] = useState('');
  
  // Resolve function to return the promise
  const [resolvePromise, setResolvePromise] = useState<((value: any) => void) | null>(null);

  const handleClose = (value: any = null) => {
    setIsOpen(false);
    if (resolvePromise) {
      resolvePromise(value);
      setResolvePromise(null);
    }
  };

  const showAlert = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info', title?: string): Promise<void> => {
    return new Promise((resolve) => {
      setDialogType('alert');
      setOptions({ message, type, title });
      setResolvePromise(() => resolve);
      setIsOpen(true);
    });
  };

  const showConfirm = (message: string, title: string = 'Confirmação'): Promise<boolean> => {
    return new Promise((resolve) => {
      setDialogType('confirm');
      setOptions({ message, title });
      setResolvePromise(() => resolve);
      setIsOpen(true);
    });
  };

  const showPrompt = (message: string, defaultValue: string = '', title: string = 'Entrada necessária'): Promise<string | null> => {
    return new Promise((resolve) => {
      setDialogType('prompt');
      setOptions({ message, title, defaultValue });
      setInputValue(defaultValue);
      setResolvePromise(() => resolve);
      setIsOpen(true);
    });
  };

  return (
    <DialogContext.Provider value={{ showAlert, showConfirm, showPrompt }}>
      {children}
      
      {isOpen && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div 
            className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 flex flex-col items-center text-center">
              
              {/* Icon */}
              <div className="mb-4">
                {dialogType === 'confirm' || dialogType === 'prompt' ? (
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                    <HelpCircle className="w-8 h-8 text-blue-600" />
                  </div>
                ) : options.type === 'success' ? (
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                  </div>
                ) : options.type === 'error' ? (
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                    <X className="w-8 h-8 text-red-600" />
                  </div>
                ) : (
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                    <AlertCircle className="w-8 h-8 text-slate-600" />
                  </div>
                )}
              </div>
              
              <h2 className="text-xl font-extrabold text-slate-800 mb-2">
                {options.title || (dialogType === 'alert' && options.type === 'error' ? 'Erro' : dialogType === 'alert' && options.type === 'success' ? 'Sucesso' : 'Aviso')}
              </h2>
              
              <p className="text-sm text-slate-600 mb-6 whitespace-pre-wrap leading-relaxed">
                {options.message}
              </p>

              {dialogType === 'prompt' && (
                <input 
                  type="text" 
                  autoFocus
                  className="w-full border border-slate-200 p-3 rounded-xl outline-none focus:border-blue-500 mb-6 text-sm text-slate-700"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleClose(inputValue);
                  }}
                />
              )}
              
              <div className="flex w-full gap-3">
                {(dialogType === 'confirm' || dialogType === 'prompt') && (
                  <button
                    onClick={() => handleClose(dialogType === 'confirm' ? false : null)}
                    className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-2xl font-bold text-sm hover:bg-slate-200 transition-all"
                  >
                    {options.cancelText || 'Cancelar'}
                  </button>
                )}
                
                <button
                  onClick={() => handleClose(dialogType === 'prompt' ? inputValue : true)}
                  className={`flex-1 py-3 rounded-2xl font-extrabold text-sm transition-all text-white shadow-lg ${
                    options.type === 'error' ? 'bg-red-600 hover:bg-red-700 shadow-red-600/20' :
                    options.type === 'success' ? 'bg-green-600 hover:bg-green-700 shadow-green-600/20' :
                    'bg-[#003B5C] hover:bg-[#005a8c] shadow-[#003B5C]/20'
                  }`}
                >
                  {options.confirmText || 'OK'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DialogContext.Provider>
  );
}

export const useDialog = () => {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('useDialog must be used within a DialogProvider');
  }
  return context;
};
